CREATE TABLE IF NOT EXISTS user_tutorial_progress (
  id               BIGSERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_key     VARCHAR(100) NOT NULL,
  tutorial_version INTEGER NOT NULL CHECK (tutorial_version > 0),
  status           VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress', 'skipped', 'completed')),
  current_step     INTEGER NOT NULL DEFAULT 0 CHECK (current_step >= 0),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tutorial_key, tutorial_version)
);

CREATE INDEX IF NOT EXISTS idx_user_tutorial_progress_user
  ON user_tutorial_progress(user_id);

DROP TRIGGER IF EXISTS set_user_tutorial_progress_updated_at ON user_tutorial_progress;
CREATE TRIGGER set_user_tutorial_progress_updated_at
  BEFORE UPDATE ON user_tutorial_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_tutorial_progress ENABLE ROW LEVEL SECURITY;

