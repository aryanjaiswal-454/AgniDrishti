-- Add auth_provider and allow password_hash to be NULL for OAuth users
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local';
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;