ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'stockable' CHECK (product_type IN ('stockable', 'service'));
ALTER TABLE products ADD COLUMN cogs_account_id BIGINT;
