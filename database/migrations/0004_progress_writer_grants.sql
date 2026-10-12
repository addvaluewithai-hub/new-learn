-- The runtime role reads the catalog and now also writes a student's own enrollments and
-- progress; ownership is enforced by the API (user from the session, never from JSON).
-- Conditional so the migration also applies to databases without that role (tests, new branches).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT ON learn_app.lesson_enrollments TO learn_app_reader;
    GRANT SELECT, INSERT, UPDATE ON learn_app.lesson_progress TO learn_app_reader;
  END IF;
END $$;
