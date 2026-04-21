-- 002_contract_alignment.sql
-- Align ai-service persistence contract to UUID/TIMESTAMPTZ/role enums.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS id_v2 UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id_v2 UUID,
  ADD COLUMN IF NOT EXISTS created_at_v2 TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at_v2 TIMESTAMPTZ DEFAULT now();

ALTER TABLE ai_messages
  ADD COLUMN IF NOT EXISTS id_v2 UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS conversation_id_v2 UUID,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS created_at_v2 TIMESTAMPTZ DEFAULT now();

UPDATE ai_conversations
SET
  user_id_v2 = COALESCE(user_id_v2, '00000000-0000-0000-0000-000000000000'::uuid),
  created_at_v2 = COALESCE(created_at_v2, created_at AT TIME ZONE 'UTC'),
  updated_at_v2 = COALESCE(updated_at_v2, updated_at AT TIME ZONE 'UTC')
WHERE user_id_v2 IS NULL OR created_at_v2 IS NULL OR updated_at_v2 IS NULL;

UPDATE ai_messages
SET
  role = CASE sender
    WHEN 'USER' THEN 'user'
    WHEN 'ASSISTANT' THEN 'assistant'
    ELSE 'system'
  END,
  created_at_v2 = COALESCE(created_at_v2, created_at AT TIME ZONE 'UTC')
WHERE role IS NULL OR created_at_v2 IS NULL;

UPDATE ai_messages msg
SET conversation_id_v2 = conv.id_v2
FROM ai_conversations conv
WHERE msg.conversation_id = conv.id
  AND msg.conversation_id_v2 IS NULL;

ALTER TABLE ai_messages DROP CONSTRAINT IF EXISTS fk_ai_messages_conversation;
ALTER TABLE ai_messages DROP CONSTRAINT IF EXISTS chk_ai_messages_sender;

ALTER TABLE ai_conversations DROP CONSTRAINT IF EXISTS ai_conversations_pkey;
ALTER TABLE ai_messages DROP CONSTRAINT IF EXISTS ai_messages_pkey;

ALTER TABLE ai_conversations DROP COLUMN IF EXISTS id;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS user_id;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS created_at;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS updated_at;

ALTER TABLE ai_messages DROP COLUMN IF EXISTS id;
ALTER TABLE ai_messages DROP COLUMN IF EXISTS conversation_id;
ALTER TABLE ai_messages DROP COLUMN IF EXISTS sender;
ALTER TABLE ai_messages DROP COLUMN IF EXISTS created_at;

ALTER TABLE ai_conversations RENAME COLUMN id_v2 TO id;
ALTER TABLE ai_conversations RENAME COLUMN user_id_v2 TO user_id;
ALTER TABLE ai_conversations RENAME COLUMN created_at_v2 TO created_at;
ALTER TABLE ai_conversations RENAME COLUMN updated_at_v2 TO updated_at;

ALTER TABLE ai_messages RENAME COLUMN id_v2 TO id;
ALTER TABLE ai_messages RENAME COLUMN conversation_id_v2 TO conversation_id;
ALTER TABLE ai_messages RENAME COLUMN created_at_v2 TO created_at;

ALTER TABLE ai_conversations
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE ai_messages
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE ai_conversations ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);
ALTER TABLE ai_messages ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);

ALTER TABLE ai_messages
  ADD CONSTRAINT fk_ai_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES ai_conversations(id)
    ON DELETE CASCADE;

ALTER TABLE ai_messages
  ADD CONSTRAINT chk_ai_messages_role
    CHECK (role IN ('user', 'assistant', 'system'));

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated_v2 ON ai_conversations(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created_v2 ON ai_messages(conversation_id, created_at);
