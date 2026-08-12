package dev.ishita.idempotent_payment_gateway.exception;

public class IdempotencyKeyConflictException extends RuntimeException {
    public IdempotencyKeyConflictException(String message) {
        super(message);
    }
}
