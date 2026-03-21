---
name: core-db
description: Data model of core database in core service. Use when working with core service to know how is the data model.
---

# Core DB — `core-service`

## `permits`

**Descripción:** permisos (B, A1, ...)

**Campos:**

- `id` (PK, serial/int)
- `code` (varchar/text, NOT NULL)
- `name` (text, NOT NULL)

**Constraints:**

- PRIMARY KEY (`id`)
- UNIQUE (`code`)

---

## `topics`

**Descripción:** temas por permiso.

**Campos:**

- `id` (PK, serial/int)
- `permit_id` (FK → `permits.id`, NOT NULL)
- `topic_number` (int, NOT NULL)
- `name` (text, NOT NULL)

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`permit_id`) REFERENCES `permits`(`id`) ON DELETE CASCADE
- UNIQUE (`permit_id`, `topic_number`)

**Índices recomendados:**

- INDEX (`permit_id`)

---

## `questions`

**Descripción:** banco de preguntas importado desde JSON.

**Campos:**

- `id` (PK, serial/int)
- `external_id` (varchar(50), NOT NULL) — ej: `T01_P001`
- `permit_id` (FK → `permits.id`, NOT NULL)
- `topic_id` (FK → `topics.id`, NOT NULL)
- `statement` (text, NOT NULL)
- `difficulty` (smallint, NULL)
- `requires_image` (boolean, NOT NULL, DEFAULT false)
- `image_description` (text, NULL)
- `base_explanation` (text, NULL)
- `created_at` (timestamp, NOT NULL, DEFAULT now())

**Constraints:**

- PRIMARY KEY (`id`)
- UNIQUE (`external_id`)
- FOREIGN KEY (`permit_id`) REFERENCES `permits`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE RESTRICT
- CHECK (`difficulty` BETWEEN 1 AND 5)

**Índices recomendados:**

- INDEX (`permit_id`)
- INDEX (`topic_id`)

---

## `question_options`

**Descripción:** opciones a/b/c/d por pregunta.

**Campos:**

- `id` (PK, serial/int)
- `question_id` (FK → `questions.id`, NOT NULL)
- `label` (char(1), NOT NULL)
- `text` (text, NOT NULL)

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
- UNIQUE (`question_id`, `label`)
- CHECK (`label` IN ('a','b','c','d'))

**Índices recomendados:**

- INDEX (`question_id`)

---

## `question_correct_options`

**Descripción:** opción correcta (1:1 con questions).

**Campos:**

- `question_id` (PK + FK → `questions.id`)
- `correct_label` (char(1), NOT NULL)

**Constraints:**

- PRIMARY KEY (`question_id`)
- FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
- CHECK (`correct_label` IN ('a','b','c','d'))

---

## `tests`

**Descripción:** definición/configuración de un test generado.

**Campos:**

- `id` (PK, serial/int)
- `user_id` (int, NOT NULL) ← **Logical Reference** a `auth.user.id`
- `mode` (text, NOT NULL) — `RANDOM`, `TOPIC`, `PERMIT`
- `permit_id` (FK → `permits.id`, NULLABLE)
- `topic_id` (FK → `topics.id`, NULLABLE)
- `num_questions` (int, NOT NULL, DEFAULT 30)
- `created_at` (timestamp, NOT NULL, DEFAULT now())

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`permit_id`) REFERENCES `permits`(`id`) ON DELETE RESTRICT
- FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE RESTRICT
- CHECK (`mode` IN ('RANDOM','TOPIC','PERMIT'))
- CHECK (`num_questions` = 30)

**Validación (nivel aplicación):**

- `user_id` debe existir en **auth-service**.
- Reglas por modo:
  - `TOPIC` ⇒ `topic_id` NOT NULL
  - `PERMIT` ⇒ `permit_id` NOT NULL y `topic_id` NULL (recomendado)
  - `RANDOM` ⇒ normalmente `permit_id` NOT NULL

**Índices recomendados:**

- INDEX (`user_id`)
- INDEX (`permit_id`)
- INDEX (`topic_id`)

---

## `test_questions`

**Descripción:** preguntas que componen un test (N:M).

**Campos:**

- `test_id` (FK → `tests.id`, NOT NULL)
- `question_id` (FK → `questions.id`, NOT NULL)

**Constraints:**

- PRIMARY KEY (`test_id`, `question_id`)
- FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE
- FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT

---

## `test_attempts`

**Descripción:** intentos de un test.

**Campos:**

- `id` (PK, serial/int)
- `test_id` (FK → `tests.id`, NOT NULL)
- `user_id` (int, NOT NULL) ← **Logical Reference** a `auth.user.id`
- `started_at` (timestamp, NOT NULL, DEFAULT now())
- `finished_at` (timestamp, NULL)
- `score` (int, NULL)
- `total_questions` (int, NOT NULL, DEFAULT 30)
- `correct_count` (int, NOT NULL)
- `wrong_count` (int, NOT NULL)

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE
- CHECK (`total_questions` = 30)
- CHECK (`correct_count` BETWEEN 0 AND 30)
- CHECK (`wrong_count` BETWEEN 0 AND 30)
- CHECK (`correct_count + wrong_count` = 30)

**Regla de aprobado (negocio):**

- Apto si `wrong_count <= 3`.

**Índices recomendados:**

- INDEX (`user_id`, `finished_at`)
- INDEX (`test_id`)

---

## `attempt_answers`

**Descripción:** respuestas dadas en un intento.

**Campos:**

- `id` (PK, serial/int)
- `attempt_id` (FK → `test_attempts.id`, NOT NULL)
- `question_id` (FK → `questions.id`, NOT NULL)
- `selected_label` (char(1), NOT NULL)
- `is_correct` (boolean, NOT NULL)
- `answered_at` (timestamp, NOT NULL, DEFAULT now())

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts`(`id`) ON DELETE CASCADE
- FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT
- UNIQUE (`attempt_id`, `question_id`)
- CHECK (`selected_label` IN ('a','b','c','d'))

**Índices recomendados:**

- INDEX (`attempt_id`)
- INDEX (`question_id`)
- INDEX (`answered_at`)

---
