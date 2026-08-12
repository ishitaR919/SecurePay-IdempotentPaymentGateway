package dev.ishita.idempotent_payment_gateway.model.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateAccountDto(
        @NotBlank(message = "Account name is required")
        @Size(max = 255, message = "Account name cannot exceed 255 characters")
        String name,

        @NotNull(message = "Initial balance is required")
        @Min(value = 0, message = "Initial balance must be greater than or equal to zero")
        BigDecimal initialBalance,

        String currency
) {}