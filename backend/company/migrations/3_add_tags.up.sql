CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_tags_company_id ON tags(company_id);
