ALTER TABLE product_categories ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX idx_product_categories_company_id ON product_categories(company_id);
CREATE INDEX idx_products_company_id ON products(company_id);
