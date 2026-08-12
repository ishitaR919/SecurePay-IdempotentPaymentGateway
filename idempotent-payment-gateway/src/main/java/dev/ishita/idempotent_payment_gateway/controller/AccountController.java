package dev.ishita.idempotent_payment_gateway.controller;

import dev.ishita.idempotent_payment_gateway.model.dtos.AccountBalanceDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.AccountResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.CreateAccountDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.PageResponseDto;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "endpoints for account management")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @Operation(summary = "Create a new account", description = "initializes a new bank account with a starting balance")
    @ApiResponse(responseCode = "201", description = "account created successfully")
    public ResponseEntity<AccountResponseDto> create(
            @RequestBody @Valid CreateAccountDto dto,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        AccountResponseDto createdAccount = accountService.create(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
    }

    @GetMapping
    @Operation(summary = "Get user accounts", description = "returns a paginated list of accounts for the logged-in user")
    public ResponseEntity<PageResponseDto<AccountResponseDto>> getAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        PageResponseDto<AccountResponseDto> accounts = accountService.getUserAccounts(currentUser, page, size);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account details", description = "retrieves details for a specific account")
    public ResponseEntity<AccountResponseDto> getAccountById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        AccountResponseDto account = accountService.getAccountById(id, currentUser);
        return ResponseEntity.ok(account);
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get account balance", description = "retrieves the current balance for a specific account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "balance retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "account not found")
    })
    public ResponseEntity<AccountBalanceDto> getBalance(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        AccountBalanceDto balanceDto = accountService.getAccountBalance(id, currentUser);
        return ResponseEntity.ok(balanceDto);
    }

}