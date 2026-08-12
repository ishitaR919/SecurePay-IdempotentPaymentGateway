package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponseDto(
        UUID transactionId,
        UUID accountId,
        BigDecimal amount,
        String type,
        String status,
        BigDecimal balanceAfter,
        String currency,
        LocalDateTime createdAt,
        String message,
        boolean cached
) {
    public TransactionResponseDto(UUID transactionId, String status, BigDecimal balanceAfter, String message) {
        this(transactionId, null, null, null, status, balanceAfter, "INR", LocalDateTime.now(), message, false);
    }

    public TransactionResponseDto withCached(boolean isCached) {
        return new TransactionResponseDto(
                this.transactionId,
                this.accountId,
                this.amount,
                this.type,
                this.status,
                this.balanceAfter,
                this.currency,
                this.createdAt,
                this.message,
                isCached
        );
    }
}
