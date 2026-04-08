---
name: auth-db
description: Data model of auth database in auth service. Use when working with auth service to know how is the data model.
---

# Auth DB — `auth-service`

## `driving_schools`

**Descripción:** autoescuelas registradas.

**Campos:**

- `id` (PK, serial/int)
- `name` (text, NOT NULL)
- `email` (text, NULL)
- `created_at` (timestamp, NOT NULL, DEFAULT now())

**Constraints:**

- PRIMARY KEY (`id`)

---

## `user`

**Descripción:** usuarios (alumnos y admins de autoescuela).

**Campos:**

- `id` (PK, serial/int)
- `school_id` (FK → `driving_schools.id`, NULLABLE)
- `email` (text, NOT NULL)
- `password_hash` (text, NOT NULL)
- `role` (text, NOT NULL) — `STUDENT`, `SCHOOL_ADMIN`
- `full_name` (text, NOT NULL)
- `created_at` (timestamp, NOT NULL, DEFAULT now())
- `is_active` (boolean, NOT NULL, DEFAULT true)

**Constraints:**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`school_id`) REFERENCES `driving_schools`(`id`) ON DELETE SET NULL
- UNIQUE (`email`)
- CHECK (`role` IN ('STUDENT','SCHOOL_ADMIN'))

**Índices recomendados:**

- INDEX (`school_id`)

---

## `student_permits`

**Descripción:** permisos contratados/asignados a un alumno. Permite B + A1 simultáneamente.

**Campos:**

- `user_id` (FK → `user.id`, NOT NULL)
- `permit_id` (int, NOT NULL) ← **Logical Reference** a `core.permits.id`
- `assigned_at` (timestamp, NOT NULL, DEFAULT now())
- `status` (text, NOT NULL) — `ACTIVE`, `SUSPENDED`, `FINISHED`

**Constraints:**

- PRIMARY KEY (`user_id`, `permit_id`)
- FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
- CHECK (`status` IN ('ACTIVE','SUSPENDED','FINISHED'))

**Validación (nivel aplicación):**

- `permit_id` debe existir en el **core-service** (`permits.id`), validable al asignar permisos.

**Índices recomendados:**

- INDEX (`user_id`)
- INDEX (`permit_id`)

---
