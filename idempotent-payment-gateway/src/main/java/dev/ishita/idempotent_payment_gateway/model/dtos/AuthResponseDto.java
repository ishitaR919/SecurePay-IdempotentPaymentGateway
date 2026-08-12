package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.util.UUID;

public record AuthResponseDto(
        String token,
        String tokenType,
        long expiresIn,
        UUID userId,
        String name,
        String email
) {
    public AuthResponseDto(String token, long expiresIn, UUID userId, String name, String email) {
        this(token, "Bearer", expiresIn, userId, name, email);
    }
}
