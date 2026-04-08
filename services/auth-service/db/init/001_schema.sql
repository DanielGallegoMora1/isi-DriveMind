-- 001_schema.sql
-- DB: auth_db
-- Aligned with AGENTS.md contract: UUID v4, TIMESTAMPTZ, all roles, all required columns.

-- Extension para UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS driving_schools (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NULL,
  tax_id     TEXT        NULL,
  address    TEXT        NULL,
  phone      TEXT        NULL,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID        NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  full_name     TEXT        NOT NULL,
  document_id   TEXT        NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_user_school
    FOREIGN KEY (school_id)
    REFERENCES driving_schools(id)
    ON DELETE SET NULL,

  CONSTRAINT uq_user_email
    UNIQUE (email),

  CONSTRAINT chk_user_role
    CHECK (role IN ('student', 'school_admin', 'system_admin'))
);

-- Relación alumno <-> permisos de conducción asignados
-- permit_id es referencia lógica a core_db (sin FK cruzada)
CREATE TABLE IF NOT EXISTS student_licenses (
  user_id     UUID        NOT NULL,
  license_code TEXT       NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT        NOT NULL DEFAULT 'active',

  CONSTRAINT pk_student_licenses
    PRIMARY KEY (user_id, license_code),

  CONSTRAINT fk_student_licenses_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_student_licenses_status
    CHECK (status IN ('active', 'suspended', 'finished'))
);

CREATE INDEX IF NOT EXISTS idx_users_school_id    ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id   ON student_licenses(user_id);