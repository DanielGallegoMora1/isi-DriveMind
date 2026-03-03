# 3) AI DB — `ai-service`

## 3.1 `ai_conversations`

**Descripción:** conversaciones (chats) del DriveMind Assistant.

**Campos:**

- `id` (PK, serial/int)
- `user_id` (int, NOT NULL) ← **Logical Reference** a `auth.user.id`
- `title` (text, NULL)
- `created_at` (timestamp, NOT NULL, DEFAULT now())
- `updated_at` (timestamp, NOT NULL, DEFAULT now())
- `deleted_at` (timestamp, NULL) — borrado lógico

**Constraints:**

- PRIMARY KEY (`id`)

**Validación (nivel aplicación):**

- `user_id` debe existir en **auth-service** (validable por JWT + user lookup).

**Índices recomendados:**

- INDEX (`user_id`, `updated_at`)
- INDEX (`deleted_at`)

---

## 3.2 `ai_messages`

**Descripción:** mensajes de cada conversación.

**Campos:**

- `id` (PK, serial/int)
- `conversation_id` (FK → `ai_conversations.id`, NOT NULL)
- `sender` (text, NOT NULL) — `USER`, `ASSISTANT`
- `content` (text, NOT NULL)
- `created_at` (timestamp, NOT NULL, DEFAULT now())

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE CASCADE
- CHECK (`sender` IN ('USER','ASSISTANT'))

**Índices recomendados:**

- INDEX (`conversation_id`, `created_at`)

---

# Resumen de integridad entre servicios

- `auth.student_permits.permit_id` referencia lógicamente a `core.permits.id` (validación por API/core).
- `core.tests.user_id` y `core.test_attempts.user_id` referencian lógicamente a `auth.user.id` (validación por JWT/auth).
- `ai.ai_conversations.user_id` referencia lógicamente a `auth.user.id` (validación por JWT/auth).

---
