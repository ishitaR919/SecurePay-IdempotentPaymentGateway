package dev.ishita.idempotent_payment_gateway.controller;

import dev.ishita.idempotent_payment_gateway.model.dtos.PageResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionHistoryDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionResponseDto;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.service.IdempotencyService;
import dev.ishita.idempotent_payment_gateway.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Endpoints for processing payments and history")
public class TransactionController {

    private final TransactionService transactionService;
    private final IdempotencyService idempotencyService;

    @PostMapping("/transactions")
    @Operation(summary = "Process a transaction", description = "Debits or credits an account. Guarantees idempotency via key.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Transaction processed successfully"),
            @ApiResponse(responseCode = "200", description = "Transaction returned from cache (idempotent)"),
            @ApiResponse(responseCode = "409", description = "Idempotency key conflict or request in progress")
    })
    public ResponseEntity<TransactionResponseDto> createTransaction(
            @Parameter(description = "Unique key to ensure idempotency", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody @Valid TransactionRequestDto requestDto,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        String requestHash = idempotencyService.generateRequestHash(requestDto);

        // Check cache or lock key atomically
        TransactionResponseDto cachedResponse = idempotencyService.checkOrLock(idempotencyKey, requestHash);
        if (cachedResponse != null) {
            return ResponseEntity.ok(cachedResponse);
        }

        TransactionResponseDto responseDto;
        try {
            responseDto = transactionService.processTransaction(requestDto, currentUser, idempotencyKey);
            idempotencyService.save(idempotencyKey, requestHash, responseDto);
        } catch (RuntimeException ex) {
            idempotencyService.unlock(idempotencyKey);
            throw ex;
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @GetMapping("/transactions/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieves transaction details for a specific transaction")
    public ResponseEntity<TransactionHistoryDto> getTransactionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        TransactionHistoryDto transaction = transactionService.getTransactionById(id, currentUser);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/accounts/{accountId}/transactions")
    @Operation(summary = "Get account transaction history", description = "Retrieves paginated transaction history for an account")
    public ResponseEntity<PageResponseDto<TransactionHistoryDto>> getAccountTransactions(
            @PathVariable UUID accountId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortProperty,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        PageResponseDto<TransactionHistoryDto> history = transactionService.getAccountTransactions(
                accountId, currentUser, type, page, size, sortProperty, sortDirection);
        return ResponseEntity.ok(history);
    }
}