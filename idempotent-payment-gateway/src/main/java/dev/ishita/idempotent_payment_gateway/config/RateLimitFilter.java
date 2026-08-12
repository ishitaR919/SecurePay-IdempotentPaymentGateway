package dev.ishita.idempotent_payment_gateway.config;

import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.service.RateLimiterService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserEntity user) {
            // General API rate limit: 100 requests per minute per user
            rateLimiterService.checkRateLimit("user:" + user.getId(), 100, 60);

            // Extra rate limit for transaction creation: 20 per minute per user
            if ("POST".equalsIgnoreCase(request.getMethod()) && request.getRequestURI().endsWith("/transactions")) {
                rateLimiterService.checkRateLimit("user:tx:" + user.getId(), 20, 60);
            }
        }

        filterChain.doFilter(request, response);
    }
}
