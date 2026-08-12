package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountResponseDto(
        UUID id,
        String name,
        BigDecimal balance,
        String currency,
        LocalDateTime createdAt
) {}
