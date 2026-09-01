-- Migrate all existing users to admin because of early role mismatch
UPDATE users SET role = 'admin' WHERE role = 'viewer';
