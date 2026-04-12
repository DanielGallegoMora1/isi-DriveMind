-- Core-service completion hardening migration
-- Align auth identity type, extend mode/count constraints, and add stats indexes.

BEGIN;

-- 1) Identity alignment: auth JWT sub is UUID/string, so persist as text.
ALTER TABLE tests
  ALTER COLUMN user_id TYPE VARCHAR(64) USING user_id::text;

ALTER TABLE test_attempts
  ALTER COLUMN user_id TYPE VARCHAR(64) USING user_id::text;

-- 2) Contract alignment for mode + count.
ALTER TABLE tests DROP CONSTRAINT IF EXISTS chk_tests_mode;
ALTER TABLE tests
  ADD CONSTRAINT chk_tests_mode
  CHECK (mode IN ('RANDOM','TOPIC','PERMIT','FAILED'));

ALTER TABLE tests DROP CONSTRAINT IF EXISTS chk_tests_num_questions;
ALTER TABLE tests
  ADD CONSTRAINT chk_tests_num_questions
  CHECK (num_questions BETWEEN 1 AND 100);

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS chk_attempts_total_questions;
ALTER TABLE test_attempts
  ADD CONSTRAINT chk_attempts_total_questions
  CHECK (total_questions BETWEEN 1 AND 100);

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS chk_attempts_correct_range;
ALTER TABLE test_attempts
  ADD CONSTRAINT chk_attempts_correct_range
  CHECK (correct_count BETWEEN 0 AND total_questions);

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS chk_attempts_wrong_range;
ALTER TABLE test_attempts
  ADD CONSTRAINT chk_attempts_wrong_range
  CHECK (wrong_count BETWEEN 0 AND total_questions);

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS chk_attempts_sum_30;
ALTER TABLE test_attempts
  ADD CONSTRAINT chk_attempts_sum_total
  CHECK (correct_count + wrong_count = total_questions);

-- 3) Integrity/index hardening for stats-heavy queries.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_attempt_answers_attempt_question'
      AND conrelid = 'attempt_answers'::regclass
  ) THEN
    ALTER TABLE attempt_answers
      ADD CONSTRAINT uq_attempt_answers_attempt_question
      UNIQUE (attempt_id, question_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_tests_user_permit_created
  ON tests(user_id, permit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_finished
  ON test_attempts(user_id, finished_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_correct_question
  ON attempt_answers(attempt_id, is_correct, question_id);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_correct
  ON attempt_answers(question_id, is_correct);

COMMIT;
