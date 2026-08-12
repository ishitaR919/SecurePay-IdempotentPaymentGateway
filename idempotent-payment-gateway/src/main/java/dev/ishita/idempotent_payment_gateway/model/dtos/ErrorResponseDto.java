package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.time.LocalDateTime;

public record ErrorResponseDto(
        int status,
        String error,
        String message,
        LocalDateTime timestamp
) {
    public ErrorResponseDto(int status, String error, String message) {
        this(status, error, message, LocalDateTime.now());
    }
}
