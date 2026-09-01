-- ============================================================================
-- Authentication Extensions Migration
-- ============================================================================
-- Support for Google OAuth and OTP-based Forgot Password

-- 1. Add auth_provider column
DO $$ BEGIN
    CREATE TYPE auth_provider_type AS ENUM ('local', 'google', 'firebase');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE auth_provider_type ADD VALUE 'firebase';
EXCEPTION
    WHEN duplicate_object THEN null; -- catches if 'firebase' already in enum
    WHEN invalid_parameter_value THEN null;
END $$;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider auth_provider_type NOT NULL DEFAULT 'local';

-- 2. Make password_hash nullable (for users who sign up via Google)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Add OTP columns for Forgot Password functionality
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10),
ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMPTZ;

-- 4. Google Auth user ID (optional, we'll map by email primarily, but good for robust scaling)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
