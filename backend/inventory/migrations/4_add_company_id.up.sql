ALTER TABLE categories ADD COLUMN company_id INTEGER;
ALTER TABLE products ADD COLUMN company_id INTEGER;

CREATE INDEX idx_categories_company_id ON categories(company_id);
CREATE INDEX idx_products_company_id ON products(company_id);
