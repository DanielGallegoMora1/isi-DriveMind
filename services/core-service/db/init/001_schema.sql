-- 02_core_db.sql
-- DB: drivemind_core

CREATE TABLE IF NOT EXISTS permits (
  id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,

  CONSTRAINT uq_permits_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS topics (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  permit_id    INTEGER NOT NULL,
  topic_number INTEGER NOT NULL,
  name         TEXT NOT NULL,

  CONSTRAINT fk_topics_permit
    FOREIGN KEY (permit_id)
    REFERENCES permits(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_topics_permit_number
    UNIQUE (permit_id, topic_number)
);

CREATE TABLE IF NOT EXISTS questions (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_id      VARCHAR(50) NOT NULL,
  permit_id        INTEGER NOT NULL,
  topic_id         INTEGER NOT NULL,
  statement        TEXT NOT NULL,
  difficulty       SMALLINT NULL,
  requires_image   BOOLEAN NOT NULL DEFAULT FALSE,
  image_description TEXT NULL,
  base_explanation TEXT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT uq_questions_external_id
    UNIQUE (external_id),

  CONSTRAINT fk_questions_permit
    FOREIGN KEY (permit_id)
    REFERENCES permits(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_questions_topic
    FOREIGN KEY (topic_id)
    REFERENCES topics(id)
    ON DELETE RESTRICT,

  CONSTRAINT chk_questions_difficulty
    CHECK (difficulty IS NULL OR (difficulty BETWEEN 1 AND 5))
);

CREATE TABLE IF NOT EXISTS question_options (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id INTEGER NOT NULL,
  label       CHAR(1) NOT NULL,
  text        TEXT NOT NULL,

  CONSTRAINT fk_question_options_question
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_question_options_question_label
    UNIQUE (question_id, label),

  CONSTRAINT chk_question_options_label
    CHECK (label IN ('a','b','c','d'))
);

-- 1:1 (una correcta por pregunta)
CREATE TABLE IF NOT EXISTS question_correct_options (
  question_id   INTEGER PRIMARY KEY,
  correct_label CHAR(1) NOT NULL,

  CONSTRAINT fk_question_correct_question
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_question_correct_label
    CHECK (correct_label IN ('a','b','c','d'))
);

-- TESTS
-- user_id es referencia lógica a auth.user.id (no FK cruzada)
CREATE TABLE IF NOT EXISTS tests (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL, -- logical reference to auth DB
  mode         TEXT NOT NULL,
  permit_id    INTEGER NULL,
  topic_id     INTEGER NULL,
  num_questions INTEGER NOT NULL DEFAULT 30,
  created_at   TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT chk_tests_mode
    CHECK (mode IN ('RANDOM','TOPIC','PERMIT')),

  CONSTRAINT chk_tests_num_questions
    CHECK (num_questions = 30),

  CONSTRAINT fk_tests_permit
    FOREIGN KEY (permit_id)
    REFERENCES permits(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_tests_topic
    FOREIGN KEY (topic_id)
    REFERENCES topics(id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS test_questions (
  test_id     INTEGER NOT NULL,
  question_id INTEGER NOT NULL,

  CONSTRAINT pk_test_questions
    PRIMARY KEY (test_id, question_id),

  CONSTRAINT fk_test_questions_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_test_questions_question
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE RESTRICT
);

-- Intentos
-- user_id referencia lógica a auth.user.id
CREATE TABLE IF NOT EXISTS test_attempts (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id         INTEGER NOT NULL,
  user_id         INTEGER NOT NULL, -- logical reference to auth DB
  started_at      TIMESTAMP NOT NULL DEFAULT now(),
  finished_at     TIMESTAMP NULL,
  score           INTEGER NULL,
  total_questions INTEGER NOT NULL DEFAULT 30,
  correct_count   INTEGER NOT NULL,
  wrong_count     INTEGER NOT NULL,

  CONSTRAINT fk_test_attempts_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_attempts_total_questions
    CHECK (total_questions = 30),

  CONSTRAINT chk_attempts_correct_range
    CHECK (correct_count BETWEEN 0 AND 30),

  CONSTRAINT chk_attempts_wrong_range
    CHECK (wrong_count BETWEEN 0 AND 30),

  CONSTRAINT chk_attempts_sum_30
    CHECK (correct_count + wrong_count = 30)
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id    INTEGER NOT NULL,
  question_id   INTEGER NOT NULL,
  selected_label CHAR(1) NOT NULL,
  is_correct    BOOLEAN NOT NULL,
  answered_at   TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT fk_attempt_answers_attempt
    FOREIGN KEY (attempt_id)
    REFERENCES test_attempts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_attempt_answers_question
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE RESTRICT,

  CONSTRAINT uq_attempt_answers_attempt_question
    UNIQUE (attempt_id, question_id),

  CONSTRAINT chk_attempt_answers_label
    CHECK (selected_label IN ('a','b','c','d'))
);

CREATE INDEX IF NOT EXISTS idx_topics_permit_id ON topics(permit_id);
CREATE INDEX IF NOT EXISTS idx_questions_permit_id ON questions(permit_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);

CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_permit_id ON tests(permit_id);
CREATE INDEX IF NOT EXISTS idx_tests_topic_id ON tests(topic_id);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id_finished ON test_attempts(user_id, finished_at);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_answered_at ON attempt_answers(answered_at);