ALTER TABLE chart_of_accounts ADD COLUMN company_id INTEGER;
ALTER TABLE journal_entries ADD COLUMN company_id INTEGER;

ALTER TABLE journal_entries ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_chart_of_accounts_company_id ON chart_of_accounts(company_id);
CREATE INDEX idx_journal_entries_company_id ON journal_entries(company_id);
