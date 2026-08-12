package dev.ishita.idempotent_payment_gateway.exception;

import dev.ishita.idempotent_payment_gateway.model.dtos.ErrorResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("Validation error: {}", errorMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR", errorMessage));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponseDto> handleMissingHeader(MissingRequestHeaderException ex) {
        log.warn("Missing required header: {}", ex.getHeaderName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), "MISSING_HEADER", "Required header '" + ex.getHeaderName() + "' is missing"));
    }

    @ExceptionHandler({AccountNotFoundException.class, TransactionNotFoundException.class})
    public ResponseEntity<ErrorResponseDto> handleNotFound(RuntimeException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDto(HttpStatus.NOT_FOUND.value(), "RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler({InsufficientBalanceException.class, InvalidTransactionException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponseDto> handleBadRequest(RuntimeException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), "INVALID_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(IdempotencyKeyConflictException.class)
    public ResponseEntity<ErrorResponseDto> handleIdempotencyConflict(IdempotencyKeyConflictException ex) {
        log.warn("Idempotency conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDto(HttpStatus.CONFLICT.value(), "IDEMPOTENCY_KEY_CONFLICT", ex.getMessage()));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponseDto> handleRateLimit(RateLimitExceededException ex) {
        log.warn("Rate limit exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponseDto(HttpStatus.TOO_MANY_REQUESTS.value(), "RATE_LIMIT_EXCEEDED", ex.getMessage()));
    }

    @ExceptionHandler({AccessDeniedException.class, org.springframework.security.access.AccessDeniedException.class})
    public ResponseEntity<ErrorResponseDto> handleAccessDenied(Exception ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponseDto(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", "You do not have permission to access this resource"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponseDto> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponseDto(HttpStatus.UNAUTHORIZED.value(), "UNAUTHENTICATED", "Invalid email or password"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGenericException(Exception ex) {
        log.error("Unhandled server error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDto(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR", "An unexpected server error occurred"));
    }
}
