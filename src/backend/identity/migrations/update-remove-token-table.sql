-- Add new columns
ALTER TABLE remove_token
ADD COLUMN IF NOT EXISTS token_type VARCHAR(20) NOT NULL DEFAULT 'access',
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_remove_token_expiry ON remove_token (expiry_date);

-- Add index for user tracking
CREATE INDEX IF NOT EXISTS idx_remove_token_user ON remove_token (user_id);

-- Add composite index for token lookup
CREATE INDEX IF NOT EXISTS idx_remove_token_token_type ON remove_token (token, token_type);

-- Comment
COMMENT ON COLUMN remove_token.token_type IS 'Type of token: access or refresh';

COMMENT ON COLUMN remove_token.user_id IS 'User ID who owns the token';

COMMENT ON COLUMN remove_token.created_at IS 'When token was blacklisted';