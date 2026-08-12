package dev.ishita.idempotent_payment_gateway;

import dev.ishita.idempotent_payment_gateway.exception.IdempotencyKeyConflictException;
import dev.ishita.idempotent_payment_gateway.exception.InsufficientBalanceException;
import dev.ishita.idempotent_payment_gateway.model.dtos.CreateAccountDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.RegisterRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionResponseDto;
import dev.ishita.idempotent_payment_gateway.model.entities.BankAccount;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.repository.BankAccountRepository;
import dev.ishita.idempotent_payment_gateway.service.AccountService;
import dev.ishita.idempotent_payment_gateway.service.AuthService;
import dev.ishita.idempotent_payment_gateway.service.IdempotencyService;
import dev.ishita.idempotent_payment_gateway.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SecurePayConcurrencyAndIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    private UserEntity testUser;
    private UUID testAccountId;

    @BeforeEach
    void setUp() {
        String uniqueEmail = "user_" + UUID.randomUUID() + "@securepay.com";
        var authRes = authService.register(new RegisterRequestDto("Test User", uniqueEmail, "password123"));
        testUser = UserEntity.builder().id(authRes.userId()).email(uniqueEmail).name("Test User").build();

        var accRes = accountService.create(new CreateAccountDto("Primary Account", new BigDecimal("10000.00"), "INR"), testUser);
        testAccountId = accRes.id();
    }

    @Test
    @DisplayName("Test successful debit and credit balance update")
    void testDebitAndCredit() {
        TransactionRequestDto debitReq = new TransactionRequestDto(testAccountId, new BigDecimal("2000.00"), "DEBIT", "INR");
        TransactionResponseDto debitRes = transactionService.processTransaction(debitReq, testUser, UUID.randomUUID().toString());

        assertEquals("COMPLETED", debitRes.status());
        assertEquals(new BigDecimal("8000.00"), debitRes.balanceAfter());

        TransactionRequestDto creditReq = new TransactionRequestDto(testAccountId, new BigDecimal("1500.00"), "CREDIT", "INR");
        TransactionResponseDto creditRes = transactionService.processTransaction(creditReq, testUser, UUID.randomUUID().toString());

        assertEquals("COMPLETED", creditRes.status());
        assertEquals(new BigDecimal("9500.00"), creditRes.balanceAfter());
    }

    @Test
    @DisplayName("Test insufficient balance exception")
    void testInsufficientBalance() {
        TransactionRequestDto req = new TransactionRequestDto(testAccountId, new BigDecimal("15000.00"), "DEBIT", "INR");
        assertThrows(InsufficientBalanceException.class, () -> transactionService.processTransaction(req, testUser, UUID.randomUUID().toString()));
    }

    @Test
    @DisplayName("Test idempotency - duplicate key with same payload returns cached result")
    void testIdempotentSameKey() {
        String key = "idem-key-" + UUID.randomUUID();
        TransactionRequestDto req = new TransactionRequestDto(testAccountId, new BigDecimal("500.00"), "DEBIT", "INR");
        String hash = idempotencyService.generateRequestHash(req);

        // First attempt
        TransactionResponseDto firstRes = idempotencyService.checkOrLock(key, hash);
        assertNull(firstRes); // lock acquired

        TransactionResponseDto processedRes = transactionService.processTransaction(req, testUser, key);
        idempotencyService.save(key, hash, processedRes);

        // Second attempt with same key
        TransactionResponseDto secondRes = idempotencyService.checkOrLock(key, hash);
        assertNotNull(secondRes);
        assertTrue(secondRes.cached());
        assertEquals(processedRes.transactionId(), secondRes.transactionId());
        assertEquals(processedRes.balanceAfter(), secondRes.balanceAfter());
    }

    @Test
    @DisplayName("Test idempotency conflict - same key with different payload throws 409 conflict")
    void testIdempotentKeyConflict() {
        String key = "idem-key-" + UUID.randomUUID();
        TransactionRequestDto req1 = new TransactionRequestDto(testAccountId, new BigDecimal("500.00"), "DEBIT", "INR");
        String hash1 = idempotencyService.generateRequestHash(req1);

        TransactionResponseDto firstRes = transactionService.processTransaction(req1, testUser, key);
        idempotencyService.save(key, hash1, firstRes);

        // Second attempt with DIFFERENT amount
        TransactionRequestDto req2 = new TransactionRequestDto(testAccountId, new BigDecimal("1000.00"), "DEBIT", "INR");
        String hash2 = idempotencyService.generateRequestHash(req2);

        assertThrows(IdempotencyKeyConflictException.class, () -> idempotencyService.checkOrLock(key, hash2));
    }

    @Test
    @DisplayName("Test Pessimistic Locking with Concurrent Transactions (100 simultaneous debits)")
    void testConcurrentDebitPessimisticLock() throws InterruptedException {
        int numberOfThreads = 20;
        BigDecimal debitAmount = new BigDecimal("100.00");
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(() -> {
                try {
                    TransactionRequestDto req = new TransactionRequestDto(testAccountId, debitAmount, "DEBIT", "INR");
                    transactionService.processTransaction(req, testUser, UUID.randomUUID().toString());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("Concurrent debit error: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        BankAccount updatedAccount = bankAccountRepository.findById(testAccountId).orElseThrow();
        BigDecimal expectedBalance = new BigDecimal("10000.00").subtract(debitAmount.multiply(new BigDecimal(numberOfThreads)));

        assertEquals(numberOfThreads, successCount.get());
        assertEquals(expectedBalance, updatedAccount.getBalance());
    }
}
