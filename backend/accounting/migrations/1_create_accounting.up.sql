CREATE TABLE chart_of_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id BIGINT REFERENCES chart_of_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_number TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  reference_type TEXT,
  reference_id BIGINT,
  description TEXT NOT NULL,
  total_debit DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_credit DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
  id BIGSERIAL PRIMARY KEY,
  journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES chart_of_accounts(id),
  description TEXT,
  debit_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  credit_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE account_balances (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES chart_of_accounts(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  opening_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  debit_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  credit_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, period_year, period_month)
);

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('1000', 'Cash', 'asset'),
('1100', 'Accounts Receivable', 'asset'),
('1200', 'Inventory', 'asset'),
('1300', 'Prepaid Expenses', 'asset'),
('1500', 'Equipment', 'asset'),
('2000', 'Accounts Payable', 'liability'),
('2100', 'Accrued Liabilities', 'liability'),
('2200', 'Short-term Debt', 'liability'),
('3000', 'Owner Equity', 'equity'),
('3100', 'Retained Earnings', 'equity'),
('4000', 'Sales Revenue', 'revenue'),
('4100', 'Service Revenue', 'revenue'),
('5000', 'Cost of Goods Sold', 'expense'),
('6000', 'Operating Expenses', 'expense'),
('6100', 'Rent Expense', 'expense'),
('6200', 'Utilities Expense', 'expense'),
('6300', 'Office Supplies Expense', 'expense');

CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entry_lines_account_id ON journal_entry_lines(account_id);
CREATE INDEX idx_account_balances_account_period ON account_balances(account_id, period_year, period_month);
