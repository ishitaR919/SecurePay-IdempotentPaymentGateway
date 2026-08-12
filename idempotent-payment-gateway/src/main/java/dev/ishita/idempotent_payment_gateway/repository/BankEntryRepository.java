package dev.ishita.idempotent_payment_gateway.repository;

import dev.ishita.idempotent_payment_gateway.model.entities.BankEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * repository responsible for persistence operations of the {@link BankEntry} entity.
 * this entity represents the individual ledger lines (debit/credit) that compose a transaction.
 */
@Repository
public interface BankEntryRepository extends JpaRepository<BankEntry, UUID> {
    org.springframework.data.domain.Page<BankEntry> findByAccountIdAndAccountUserId(
            UUID accountId,
            UUID userId,
            org.springframework.data.domain.Pageable pageable
    );

    org.springframework.data.domain.Page<BankEntry> findByAccountIdAndAccountUserIdAndType(
            UUID accountId,
            UUID userId,
            dev.ishita.idempotent_payment_gateway.model.enums.EntryType type,
            org.springframework.data.domain.Pageable pageable
    );

    java.util.Optional<BankEntry> findByTransactionIdAndAccountUserId(UUID transactionId, UUID userId);
    
    java.util.Optional<BankEntry> findByTransactionId(UUID transactionId);
}
