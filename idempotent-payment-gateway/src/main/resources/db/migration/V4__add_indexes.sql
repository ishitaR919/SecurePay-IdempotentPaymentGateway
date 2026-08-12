CREATE INDEX idx_account_user_id ON account(user_id);
CREATE INDEX idx_entry_account_id ON entry(account_id);
CREATE INDEX idx_entry_created_at ON entry(created_at);
CREATE INDEX idx_entry_transaction_id ON entry(transaction_id);
