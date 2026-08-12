package dev.ishita.idempotent_payment_gateway.service;

import dev.ishita.idempotent_payment_gateway.exception.AccountNotFoundException;
import dev.ishita.idempotent_payment_gateway.exception.InsufficientBalanceException;
import dev.ishita.idempotent_payment_gateway.exception.TransactionNotFoundException;
import dev.ishita.idempotent_payment_gateway.model.dtos.PageResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionHistoryDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionResponseDto;
import dev.ishita.idempotent_payment_gateway.model.entities.BankAccount;
import dev.ishita.idempotent_payment_gateway.model.entities.BankEntry;
import dev.ishita.idempotent_payment_gateway.model.entities.BankTransaction;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.model.enums.EntryType;
import dev.ishita.idempotent_payment_gateway.repository.BankAccountRepository;
import dev.ishita.idempotent_payment_gateway.repository.BankEntryRepository;
import dev.ishita.idempotent_payment_gateway.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final BankAccountRepository accountRepository;
    private final BankTransactionRepository transactionRepository;
    private final BankEntryRepository entryRepository;

    @Transactional
    public TransactionResponseDto processTransaction(TransactionRequestDto request, UserEntity user, String idempotencyKey) {
        MDC.put("accountId", request.accountId().toString());
        MDC.put("idempotencyKey", idempotencyKey != null ? idempotencyKey : "N/A");

        try {
            BankAccount account = accountRepository
                    .findByIdAndUserIdWithLock(request.accountId(), user.getId())
                    .orElseThrow(() -> new AccountNotFoundException("Account not found or access denied"));

            EntryType type = EntryType.valueOf(request.type().toUpperCase());

            switch (type) {
                case DEBIT -> {
                    if (account.getBalance().compareTo(request.amount()) < 0) {
                        log.warn("Transaction failed due to insufficient balance. Account: {}, Requested: {}, Available: {}",
                                account.getId(), request.amount(), account.getBalance());
                        throw new InsufficientBalanceException("Insufficient balance in account");
                    }
                    account.setBalance(account.getBalance().subtract(request.amount()));
                }
                case CREDIT -> account.setBalance(account.getBalance().add(request.amount()));
                default -> throw new IllegalArgumentException("Invalid transaction type");
            }

            BankTransaction transaction = BankTransaction.builder()
                    .description("Transaction for account " + account.getId())
                    .amount(request.amount())
                    .build();

            transactionRepository.save(transaction);
            accountRepository.save(account);

            BankEntry entry = BankEntry.builder()
                    .account(account)
                    .transaction(transaction)
                    .amount(request.type().equalsIgnoreCase("DEBIT") ? request.amount().negate() : request.amount())
                    .type(type)
                    .build();

            entryRepository.save(entry);

            MDC.put("transactionId", transaction.getId().toString());
            log.info("Transaction COMPLETED successfully. TxnId: {}, Type: {}, Amount: {}, NewBalance: {}",
                    transaction.getId(), type, request.amount(), account.getBalance());

            return new TransactionResponseDto(
                    transaction.getId(),
                    account.getId(),
                    request.amount(),
                    type.name(),
                    "COMPLETED",
                    account.getBalance(),
                    account.getCurrency(),
                    LocalDateTime.now(),
                    "Transaction executed successfully",
                    false
            );
        } finally {
            MDC.clear();
        }
    }

    @Transactional(readOnly = true)
    public TransactionHistoryDto getTransactionById(UUID transactionId, UserEntity user) {
        BankEntry entry = entryRepository.findByTransactionIdAndAccountUserId(transactionId, user.getId())
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found or access denied"));

        return mapToHistoryDto(entry);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<TransactionHistoryDto> getAccountTransactions(UUID accountId, UserEntity user, String typeFilter, int page, int size, String sortProperty, String sortDirection) {
        accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AccountNotFoundException("Account not found or access denied"));

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty != null ? sortProperty : "createdAt"));

        Page<BankEntry> entriesPage;
        if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
            EntryType entryType = EntryType.valueOf(typeFilter.toUpperCase());
            entriesPage = entryRepository.findByAccountIdAndAccountUserIdAndType(accountId, user.getId(), entryType, pageable);
        } else {
            entriesPage = entryRepository.findByAccountIdAndAccountUserId(accountId, user.getId(), pageable);
        }

        List<TransactionHistoryDto> content = entriesPage.getContent().stream()
                .map(this::mapToHistoryDto)
                .toList();

        return new PageResponseDto<>(
                content,
                entriesPage.getNumber(),
                entriesPage.getSize(),
                entriesPage.getTotalElements(),
                entriesPage.getTotalPages(),
                entriesPage.isLast()
        );
    }

    private TransactionHistoryDto mapToHistoryDto(BankEntry entry) {
        return new TransactionHistoryDto(
                entry.getTransaction().getId(),
                entry.getAccount().getId(),
                entry.getTransaction().getAmount(),
                entry.getType().name(),
                "COMPLETED",
                entry.getAccount().getBalance(),
                entry.getAccount().getCurrency(),
                entry.getCreatedAt(),
                entry.getTransaction().getDescription()
        );
    }
}