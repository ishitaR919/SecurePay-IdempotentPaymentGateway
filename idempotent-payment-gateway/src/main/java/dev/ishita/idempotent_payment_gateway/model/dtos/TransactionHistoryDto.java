package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionHistoryDto(
        UUID transactionId,
        UUID accountId,
        BigDecimal amount,
        String type,
        String status,
        BigDecimal balanceAfter,
        String currency,
        LocalDateTime createdAt,
        String description
) {}
