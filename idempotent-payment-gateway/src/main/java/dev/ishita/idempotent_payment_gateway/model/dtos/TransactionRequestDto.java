package dev.ishita.idempotent_payment_gateway.model.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.util.UUID;

public record TransactionRequestDto (
    @NotNull(message = "Account ID is required")
    UUID accountId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,

    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "(?i)^(DEBIT|CREDIT)$", message = "Type must be either DEBIT or CREDIT")
    String type,

    String currency
) {}
