ALTER TABLE customers ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE sales_orders ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE sales_orders ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE invoices ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE TABLE sales_payments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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

CREATE TABLE sales_payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES sales_payments(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_sales_orders_company_id ON sales_orders(company_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_sales_payments_company_id ON sales_payments(company_id);
CREATE INDEX idx_sales_payments_customer_id ON sales_payments(customer_id);
CREATE INDEX idx_sales_payment_allocations_payment_id ON sales_payment_allocations(payment_id);
CREATE INDEX idx_sales_payment_allocations_invoice_id ON sales_payment_allocations(invoice_id);
