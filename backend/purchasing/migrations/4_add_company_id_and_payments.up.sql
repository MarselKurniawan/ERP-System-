ALTER TABLE suppliers ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE supplier_invoices ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE purchase_orders ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE supplier_invoices ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE TABLE purchase_payments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  cash_bank_account_id INTEGER REFERENCES chart_of_accounts(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE purchase_payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES purchase_payments(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX idx_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX idx_supplier_invoices_company_id ON supplier_invoices(company_id);
CREATE INDEX idx_purchase_payments_company_id ON purchase_payments(company_id);
CREATE INDEX idx_purchase_payments_supplier_id ON purchase_payments(supplier_id);
CREATE INDEX idx_purchase_payment_allocations_payment_id ON purchase_payment_allocations(payment_id);
CREATE INDEX idx_purchase_payment_allocations_invoice_id ON purchase_payment_allocations(invoice_id);
