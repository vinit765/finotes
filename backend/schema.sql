CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_owner_id ON notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);

CREATE TABLE IF NOT EXISTS note_shares (
  id VARCHAR(36) PRIMARY KEY,
  note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_with_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_note_share UNIQUE (note_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_note_shares_user_id ON note_shares(shared_with_user_id);

CREATE TABLE IF NOT EXISTS note_versions (
  id VARCHAR(36) PRIMARY KEY,
  note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  edited_by_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  version_number INTEGER NOT NULL,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
