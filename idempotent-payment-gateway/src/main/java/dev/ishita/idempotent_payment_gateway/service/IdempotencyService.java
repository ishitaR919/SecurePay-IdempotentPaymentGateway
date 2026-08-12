package dev.ishita.idempotent_payment_gateway.service;

import dev.ishita.idempotent_payment_gateway.exception.IdempotencyKeyConflictException;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.TransactionResponseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final long TTL_HOURS = 24;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdempotencyRecord {
        private String requestHash;
        private TransactionResponseDto response;
        private String status; // PROCESSING or COMPLETED
    }

    public String generateRequestHash(TransactionRequestDto request) {
        try {
            String raw = String.format("%s:%s:%s:%s",
                    request.accountId(),
                    request.amount().stripTrailingZeros().toPlainString(),
                    request.type().toUpperCase(),
                    request.currency() != null ? request.currency().toUpperCase() : "INR"
            );
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public TransactionResponseDto checkOrLock(String idempotencyKey, String requestHash) {
        String redisKey = "idempotency:" + idempotencyKey;

        Object existingObj = redisTemplate.opsForValue().get(redisKey);
        if (existingObj instanceof IdempotencyRecord record) {
            if (!record.getRequestHash().equals(requestHash)) {
                throw new IdempotencyKeyConflictException("Idempotency key has already been used with a different request payload");
            }
            if ("PROCESSING".equals(record.getStatus())) {
                throw new IdempotencyKeyConflictException("A transaction with this idempotency key is currently processing. Please try again shortly.");
            }
            if (record.getResponse() != null) {
                return record.getResponse().withCached(true);
            }
        }

        // Lock key in PROCESSING state
        IdempotencyRecord processingRecord = new IdempotencyRecord(requestHash, null, "PROCESSING");
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(redisKey, processingRecord, 10, TimeUnit.SECONDS);

        if (Boolean.FALSE.equals(acquired)) {
            // Re-fetch in case another thread acquired it
            Object updatedObj = redisTemplate.opsForValue().get(redisKey);
            if (updatedObj instanceof IdempotencyRecord record) {
                if (!record.getRequestHash().equals(requestHash)) {
                    throw new IdempotencyKeyConflictException("Idempotency key has already been used with a different request payload");
                }
                if (record.getResponse() != null) {
                    return record.getResponse().withCached(true);
                }
            }
            throw new IdempotencyKeyConflictException("Concurrent request with the same idempotency key in progress");
        }

        return null;
    }

    public TransactionResponseDto get(String idempotencyKey) {
        Object existingObj = redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
        if (existingObj instanceof IdempotencyRecord record && record.getResponse() != null) {
            return record.getResponse().withCached(true);
        }
        if (existingObj instanceof TransactionResponseDto responseDto) {
            return responseDto.withCached(true);
        }
        return null;
    }

    public void save(String idempotencyKey, String requestHash, TransactionResponseDto responseDto) {
        String redisKey = "idempotency:" + idempotencyKey;
        IdempotencyRecord record = new IdempotencyRecord(requestHash, responseDto, "COMPLETED");
        redisTemplate.opsForValue().set(redisKey, record, TTL_HOURS, TimeUnit.HOURS);
    }

    public void unlock(String idempotencyKey) {
        redisTemplate.delete("idempotency:" + idempotencyKey);
    }
}
