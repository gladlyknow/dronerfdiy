PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_config (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS app_secret (
  name TEXT PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1 CHECK (key_version > 0),
  updated_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS catalog_product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('free', 'subscription', 'credit_pack')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'archived')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  amount_minor INTEGER NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  interval_unit TEXT CHECK (interval_unit IN ('month', 'year')),
  interval_count INTEGER CHECK (interval_count IS NULL OR interval_count > 0),
  credit_amount INTEGER NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  credit_valid_days INTEGER CHECK (credit_valid_days IS NULL OR credit_valid_days >= 0),
  provider_product_ids_json TEXT NOT NULL DEFAULT '{}',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK ((kind = 'subscription' AND interval_unit IS NOT NULL) OR kind != 'subscription')
);

CREATE TABLE IF NOT EXISTS payment_order (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES catalog_product(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'creem', 'paypal', 'manual')),
  provider_session_id TEXT,
  provider_transaction_id TEXT,
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'canceled')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  order_type TEXT NOT NULL CHECK (order_type IN ('one_time', 'subscription', 'credit_pack')),
  checkout_json TEXT NOT NULL DEFAULT '{}',
  provider_result_json TEXT,
  checkout_url TEXT,
  callback_url TEXT,
  provider_product_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  payment_email TEXT,
  paid_amount_minor INTEGER CHECK (paid_amount_minor IS NULL OR paid_amount_minor >= 0),
  paid_currency TEXT CHECK (paid_currency IS NULL OR length(paid_currency) = 3),
  credits_amount INTEGER NOT NULL DEFAULT 0 CHECK (credits_amount >= 0),
  credits_valid_days INTEGER CHECK (credits_valid_days IS NULL OR credits_valid_days >= 0),
  invoice_id TEXT,
  invoice_url TEXT,
  idempotency_key TEXT NOT NULL,
  paid_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS payment_webhook_event (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'creem', 'paypal', 'manual')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_id TEXT REFERENCES payment_order(id) ON DELETE SET NULL,
  payload_json TEXT NOT NULL,
  signature_valid INTEGER NOT NULL CHECK (signature_valid IN (0, 1)),
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'failed', 'ignored')),
  processing_error TEXT,
  received_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  processed_at INTEGER,
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS billing_subscription (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES catalog_product(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'creem', 'paypal', 'manual')),
  provider_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  interval_unit TEXT NOT NULL CHECK (interval_unit IN ('month', 'year')),
  interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
  canceled_at INTEGER,
  provider_data_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (provider, provider_subscription_id)
);

CREATE TABLE IF NOT EXISTS credit_wallet (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  last_operation_id TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  wallet_version INTEGER NOT NULL CHECK (wallet_version >= 0),
  operation_id TEXT NOT NULL UNIQUE,
  transaction_no TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('grant', 'consume', 'expire', 'adjustment', 'reversal')),
  amount INTEGER NOT NULL CHECK (amount != 0),
  remaining_amount INTEGER NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('signup', 'payment', 'subscription', 'admin', 'ai', 'manual', 'system')),
  source_id TEXT,
  expires_at INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS ai_chat (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS ai_message (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES ai_chat(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  request_id TEXT,
  task_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content_json TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  usage_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'complete', 'failed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS ai_task (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  chat_id TEXT REFERENCES ai_chat(id) ON DELETE SET NULL,
  client_request_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('chat', 'image', 'video', 'music', 'embedding')),
  provider_task_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('created', 'queued', 'running', 'completed', 'failed', 'canceled')),
  input_json TEXT NOT NULL,
  output_json TEXT,
  error_message TEXT,
  credit_operation_id TEXT REFERENCES credit_ledger(operation_id) ON DELETE SET NULL,
  cost_credits INTEGER NOT NULL DEFAULT 0 CHECK (cost_credits >= 0),
  refunded_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  completed_at INTEGER,
  UNIQUE (provider, provider_task_id),
  UNIQUE (user_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS email_delivery (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('verification', 'password_reset', 'welcome', 'payment', 'system')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  sent_at INTEGER,
  UNIQUE (provider, provider_message_id)
);

CREATE TABLE IF NOT EXISTS user_api_key (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  revoked_at INTEGER,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  request_id TEXT,
  ip_address TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS content_taxonomy (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES content_taxonomy(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag', 'collection')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS content_post (
  id TEXT PRIMARY KEY,
  author_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  post_type TEXT NOT NULL CHECK (post_type IN ('article', 'page', 'announcement')),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '{}',
  taxonomy_ids_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_status ON catalog_product(status, kind);
CREATE INDEX IF NOT EXISTS idx_payment_order_user_time ON payment_order(user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_order_user_idempotency ON payment_order(user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_order_provider_session ON payment_order(provider, provider_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_order_provider_transaction ON payment_order(provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_processing ON payment_webhook_event(processing_status, received_at);
CREATE INDEX IF NOT EXISTS idx_subscription_user_status ON billing_subscription(user_id, status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_time ON credit_ledger(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_time ON ai_chat(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_message_chat_time ON ai_message(chat_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_message_request_role
  ON ai_message(chat_id, request_id, role) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_task_user_status ON ai_task(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_user_time ON email_delivery(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_time ON admin_audit_log(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_post_status_time ON content_post(status, published_at);

INSERT OR IGNORE INTO catalog_product
  (id, name, kind, status, amount_minor, currency, interval_unit, credit_amount, metadata_json)
VALUES
  ('free', 'Free', 'free', 'inactive', 0, 'USD', NULL, 0, '{}'),
  ('pro-month', 'Pro Monthly', 'subscription', 'inactive', 0, 'USD', 'month', 0, '{}'),
  ('pro-year', 'Pro Yearly', 'subscription', 'inactive', 0, 'USD', 'year', 0, '{}'),
  ('credit-pack', 'Credit Pack', 'credit_pack', 'inactive', 0, 'USD', NULL, 0, '{}');

INSERT OR IGNORE INTO app_config (name, value) VALUES
  ('payment_enabled', 'false'),
  ('default_payment_provider', 'stripe'),
  ('creem_environment', 'sandbox'),
  ('paypal_environment', 'sandbox'),
  ('mail_from', 'DroneRF DIY <noreply@dronerfdiy.com>'),
  ('initial_credits_enabled', 'false'),
  ('initial_credits_amount', '0'),
  ('initial_credits_valid_days', '0'),
  ('ai_chat_credits', '1'),
  ('ai_image_credits', '2'),
  ('ai_video_credits', '8'),
  ('ai_music_credits', '10'),
  ('ai_enabled', 'false'),
  ('ai_models_json', '[]'),
  ('openrouter_base_url', 'https://openrouter.ai/api/v1');

INSERT OR IGNORE INTO role (id, name) VALUES
  ('admin', 'admin'),
  ('super_admin', 'super_admin');

INSERT OR IGNORE INTO permission (id, name) VALUES
  ('admin.access', 'admin.access'),
  ('admin.users.read', 'admin.users.read'),
  ('admin.users.write', 'admin.users.write'),
  ('admin.commerce.read', 'admin.commerce.read'),
  ('admin.commerce.write', 'admin.commerce.write'),
  ('admin.credits.write', 'admin.credits.write'),
  ('admin.ai.read', 'admin.ai.read'),
  ('admin.settings.write', 'admin.settings.write'),
  ('admin.content.write', 'admin.content.write');

INSERT OR IGNORE INTO role_permission (role_id, permission_id)
SELECT 'admin', id FROM permission WHERE name LIKE 'admin.%';
