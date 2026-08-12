package dev.ishita.idempotent_payment_gateway.controller;

import dev.ishita.idempotent_payment_gateway.model.dtos.AuthRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.AuthResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.RegisterRequestDto;
import dev.ishita.idempotent_payment_gateway.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration and login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with hashed password")
    public ResponseEntity<AuthResponseDto> register(@RequestBody @Valid RegisterRequestDto request) {
        AuthResponseDto response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user and returns JWT token")
    public ResponseEntity<AuthResponseDto> login(@RequestBody @Valid AuthRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
