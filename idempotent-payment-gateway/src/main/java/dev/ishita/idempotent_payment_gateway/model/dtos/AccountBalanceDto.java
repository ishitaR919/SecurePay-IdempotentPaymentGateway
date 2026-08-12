package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountBalanceDto(
        UUID id,
        String name,
        BigDecimal balance,
        String currency
) {}