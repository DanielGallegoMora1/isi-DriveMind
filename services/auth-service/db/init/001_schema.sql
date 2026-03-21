-- 01_auth_db.sql
-- DB: drivemind_auth

CREATE TABLE IF NOT EXISTS driving_schools (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user" (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id     INTEGER NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT fk_user_school
    FOREIGN KEY (school_id)
    REFERENCES driving_schools(id)
    ON DELETE SET NULL,

  CONSTRAINT uq_user_email
    UNIQUE (email),

  CONSTRAINT chk_user_role
    CHECK (role IN ('STUDENT','SCHOOL_ADMIN'))
);

-- Relación alumno <-> permisos contratados
-- Sin FK cruzada: permit_id referencia lógica a core.permits.id
CREATE TABLE IF NOT EXISTS student_permits (
  user_id     INTEGER NOT NULL,
  permit_id   INTEGER NOT NULL,  -- logical reference to core DB
  assigned_at TIMESTAMP NOT NULL DEFAULT now(),
  status      TEXT NOT NULL DEFAULT 'ACTIVE',

  CONSTRAINT pk_student_permits
    PRIMARY KEY (user_id, permit_id),

  CONSTRAINT fk_student_permits_user
    FOREIGN KEY (user_id)
    REFERENCES "user"(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_student_permits_status
    CHECK (status IN ('ACTIVE','SUSPENDED','FINISHED'))
);

CREATE INDEX IF NOT EXISTS idx_user_school_id ON "user"(school_id);
CREATE INDEX IF NOT EXISTS idx_student_permits_user_id ON student_permits(user_id);
CREATE INDEX IF NOT EXISTS idx_student_permits_permit_id ON student_permits(permit_id);