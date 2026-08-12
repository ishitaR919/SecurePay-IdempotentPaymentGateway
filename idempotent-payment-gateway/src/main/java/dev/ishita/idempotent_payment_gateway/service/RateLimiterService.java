package dev.ishita.idempotent_payment_gateway.service;

import dev.ishita.idempotent_payment_gateway.exception.RateLimitExceededException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void checkRateLimit(String key, int maxRequests, long timeWindowSeconds) {
        String redisKey = "ratelimit:" + key;
        Long currentCount = redisTemplate.opsForValue().increment(redisKey, 1);

        if (currentCount != null && currentCount == 1) {
            redisTemplate.expire(redisKey, timeWindowSeconds, TimeUnit.SECONDS);
        }

        if (currentCount != null && currentCount > maxRequests) {
            throw new RateLimitExceededException("Rate limit exceeded. Maximum " + maxRequests + " requests allowed per " + timeWindowSeconds + " seconds.");
        }
    }
}
