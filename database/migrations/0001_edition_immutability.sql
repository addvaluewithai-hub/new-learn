CREATE FUNCTION learn_app.protect_lesson_edition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Lesson editions are immutable; create another content_revision';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER immutable_lesson_edition BEFORE UPDATE OR DELETE ON learn_app.lesson_editions
FOR EACH ROW EXECUTE FUNCTION learn_app.protect_lesson_edition();
