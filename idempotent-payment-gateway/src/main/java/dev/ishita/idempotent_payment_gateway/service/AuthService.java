package dev.ishita.idempotent_payment_gateway.service;

import dev.ishita.idempotent_payment_gateway.model.dtos.AuthRequestDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.AuthResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.RegisterRequestDto;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.repository.UserRepository;
import dev.ishita.idempotent_payment_gateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponseDto register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Email address is already registered");
        }

        UserEntity user = UserEntity.builder()
                .name(dto.name())
                .email(dto.email())
                .passwordHash(passwordEncoder.encode(dto.password()))
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponseDto(token, tokenProvider.getExpirationMs(), user.getId(), user.getName(), user.getEmail());
    }

    public AuthResponseDto login(AuthRequestDto dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password())
        );

        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponseDto(token, tokenProvider.getExpirationMs(), user.getId(), user.getName(), user.getEmail());
    }
}
