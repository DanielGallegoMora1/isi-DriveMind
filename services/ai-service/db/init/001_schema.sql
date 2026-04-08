-- 03_ai_db.sql
-- DB: drivemind_ai

CREATE TABLE IF NOT EXISTS ai_conversations (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL, -- logical reference to auth DB
  title      TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id  INTEGER NOT NULL,
  sender          TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT fk_ai_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES ai_conversations(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_ai_messages_sender
    CHECK (sender IN ('USER','ASSISTANT'))
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated ON ai_conversations(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_deleted_at ON ai_conversations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at);