ALTER TABLE invoices ADD COLUMN payment_terms INTEGER DEFAULT 30;
ALTER TABLE invoices ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid'));
