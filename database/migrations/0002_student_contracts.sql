CREATE FUNCTION learn_app.protect_enrollment_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.user_id, NEW.lesson_id, NEW.content_revision) IS DISTINCT FROM
     (OLD.user_id, OLD.lesson_id, OLD.content_revision) THEN
    RAISE EXCEPTION 'Enrollment identity and pinned content edition are immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER pinned_enrollment BEFORE UPDATE ON learn_app.lesson_enrollments
FOR EACH ROW EXECUTE FUNCTION learn_app.protect_enrollment_identity();
--> statement-breakpoint
CREATE FUNCTION learn_app.protect_progress_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.enrollment_id IS DISTINCT FROM OLD.enrollment_id OR NEW.revision <> OLD.revision + 1 THEN
    RAISE EXCEPTION 'Progress identity is immutable and revision must increment by one';
  END IF;
  IF OLD.completed_at IS NOT NULL AND NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    RAISE EXCEPTION 'Completion must survive replay and rewind';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER durable_progress BEFORE UPDATE ON learn_app.lesson_progress
FOR EACH ROW EXECUTE FUNCTION learn_app.protect_progress_update();
