package dev.ishita.idempotent_payment_gateway.service;

import dev.ishita.idempotent_payment_gateway.exception.AccountNotFoundException;
import dev.ishita.idempotent_payment_gateway.model.dtos.AccountBalanceDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.AccountResponseDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.CreateAccountDto;
import dev.ishita.idempotent_payment_gateway.model.dtos.PageResponseDto;
import dev.ishita.idempotent_payment_gateway.model.entities.BankAccount;
import dev.ishita.idempotent_payment_gateway.model.entities.UserEntity;
import dev.ishita.idempotent_payment_gateway.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final BankAccountRepository accountRepository;

    @Transactional
    public AccountResponseDto create(CreateAccountDto dto, UserEntity user) {
        BankAccount account = new BankAccount();
        account.setName(dto.name());
        account.setBalance(dto.initialBalance());
        account.setCurrency(dto.currency() != null ? dto.currency() : "INR");
        account.setUser(user);

        accountRepository.save(account);

        return mapToAccountResponseDto(account);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<AccountResponseDto> getUserAccounts(UserEntity user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BankAccount> accountsPage = accountRepository.findByUserId(user.getId(), pageable);

        List<AccountResponseDto> content = accountsPage.getContent().stream()
                .map(this::mapToAccountResponseDto)
                .toList();

        return new PageResponseDto<>(
                content,
                accountsPage.getNumber(),
                accountsPage.getSize(),
                accountsPage.getTotalElements(),
                accountsPage.getTotalPages(),
                accountsPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public AccountResponseDto getAccountById(UUID accountId, UserEntity user) {
        BankAccount account = accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AccountNotFoundException("Account not found or access denied"));

        return mapToAccountResponseDto(account);
    }

    @Transactional(readOnly = true)
    public AccountBalanceDto getAccountBalance(UUID accountId, UserEntity user) {
        BankAccount account = accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AccountNotFoundException("Account not found or access denied"));

        return new AccountBalanceDto(
                account.getId(),
                account.getName(),
                account.getBalance(),
                account.getCurrency()
        );
    }

    private AccountResponseDto mapToAccountResponseDto(BankAccount account) {
        return new AccountResponseDto(
                account.getId(),
                account.getName(),
                account.getBalance(),
                account.getCurrency(),
                account.getCreatedAt()
        );
    }
}
