PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0 CHECK (emailVerified IN (0, 1)),
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE (providerId, accountId)
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);
CREATE TABLE IF NOT EXISTS role (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS permission (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS role_permission (role_id TEXT NOT NULL REFERENCES role(id) ON DELETE CASCADE, permission_id TEXT NOT NULL REFERENCES permission(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id));
CREATE TABLE IF NOT EXISTS user_role (user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, role_id TEXT NOT NULL REFERENCES role(id) ON DELETE CASCADE, PRIMARY KEY (user_id, role_id));
INSERT OR IGNORE INTO role (id, name) VALUES ('user', 'user');

CREATE TABLE IF NOT EXISTS user_favorite (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('question','knowledge','drone_article','video','tool')),
  resource_id TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (user_id, resource_type, resource_id)
);
CREATE TABLE IF NOT EXISTS resource_activity (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('question','knowledge','drone_article','video','tool')),
  resource_id TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('view','watch')),
  view_count INTEGER NOT NULL DEFAULT 1 CHECK (view_count >= 0), position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0), total_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_seconds >= 0), completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  last_viewed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (user_id, resource_type, resource_id, kind)
);
CREATE TABLE IF NOT EXISTS learning_progress (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('question','knowledge','drone_article','video','tool')),
  resource_id TEXT NOT NULL, progress REAL NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1), completed_at INTEGER, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (user_id, resource_type, resource_id)
);
CREATE TABLE IF NOT EXISTS exam_session (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('A','B','C')), bank_version TEXT NOT NULL, question_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0), correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0 AND correct <= total), score REAL CHECK (score IS NULL OR score BETWEEN 0 AND 100), elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0), created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), completed_at INTEGER
);
CREATE TABLE IF NOT EXISTS question_attempt (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES exam_session(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, question_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A','B','C')), bank_version TEXT NOT NULL, displayed_order TEXT NOT NULL,
  selected_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct INTEGER CHECK (is_correct IN (0, 1)),
  answered_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (session_id, question_id)
);
CREATE TABLE IF NOT EXISTS question_mastery (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A', 'B', 'C')),
  mastery REAL NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 1),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count INTEGER NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  consecutive_correct INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_correct >= 0),
  last_answer TEXT,
  is_mastered INTEGER NOT NULL DEFAULT 0 CHECK (is_mastered IN (0, 1)),
  last_attempt_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (user_id, question_id, level)
);
CREATE TABLE IF NOT EXISTS local_data_import (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_device_id TEXT NOT NULL,
  payload_version TEXT NOT NULL,
  digest TEXT NOT NULL,
  item_count INTEGER NOT NULL CHECK (item_count >= 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (user_id, source_device_id, payload_version, digest)
);
CREATE INDEX IF NOT EXISTS idx_session_user_expires ON session (userId, expiresAt);
CREATE INDEX IF NOT EXISTS idx_account_user ON account (userId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification (identifier);
CREATE INDEX IF NOT EXISTS idx_favorite_user_type ON user_favorite (user_id, resource_type, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON resource_activity (user_id, last_viewed_at);
CREATE INDEX IF NOT EXISTS idx_progress_user_time ON learning_progress (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_exam_session_user_time ON exam_session (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attempt_user_time ON question_attempt (user_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_attempt_session ON question_attempt (session_id);
CREATE INDEX IF NOT EXISTS idx_mastery_user_level ON question_mastery (user_id, level, updated_at);
