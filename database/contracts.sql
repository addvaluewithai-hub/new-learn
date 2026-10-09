DO $checks$
DECLARE
  enrollment uuid;
BEGIN
  BEGIN
    UPDATE learn_app.lesson_editions SET manifest_hash = manifest_hash;
    RAISE EXCEPTION 'Edition immutability missing' USING ERRCODE = 'P0003';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  BEGIN
    INSERT INTO learn_app.lesson_releases(lesson_id, content_revision, stage)
    VALUES ('unknown-lesson', 'unknown-edition', 'published');
    RAISE EXCEPTION 'Edition FK missing' USING ERRCODE = 'P0003';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO learn_app.lesson_enrollments(user_id,lesson_id,content_revision)
    VALUES ('contract-test','chem-gas-states-matter','curriculum-v3-english-2026-10-06')
    RETURNING id INTO enrollment;
    BEGIN
      UPDATE learn_app.lesson_enrollments SET user_id='someone-else' WHERE id=enrollment;
      RAISE EXCEPTION 'Enrollment identity guard missing' USING ERRCODE = 'P0003';
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
    END;
    INSERT INTO learn_app.lesson_progress(enrollment_id,state,completed_at)
    VALUES (enrollment,'{"schemaVersion":1,"sceneId":"S01","phase":"complete","frame":0,"reachedSceneIds":[],"attempts":[]}'::jsonb,now());
    BEGIN
      UPDATE learn_app.lesson_progress SET completed_at=NULL, revision=1 WHERE enrollment_id=enrollment;
      RAISE EXCEPTION 'Durable completion guard missing' USING ERRCODE = 'P0003';
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
    END;
    BEGIN
      UPDATE learn_app.lesson_progress SET revision=0 WHERE enrollment_id=enrollment;
      RAISE EXCEPTION 'Revision guard missing' USING ERRCODE = 'P0003';
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
    END;
    UPDATE learn_app.lesson_progress SET revision=1 WHERE enrollment_id=enrollment;
    RAISE EXCEPTION 'Rollback temporary contract rows' USING ERRCODE = 'P0002';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL;
  END;
END;
$checks$;
