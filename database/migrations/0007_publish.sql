CREATE TABLE "learn_app"."course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollment_user" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "learn_app"."course_progress" (
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_progress_enrollment_id_lesson_id_pk" PRIMARY KEY("enrollment_id","lesson_id"),
	CONSTRAINT "course_progress_revision" CHECK ("learn_app"."course_progress"."revision" >= 0),
	CONSTRAINT "course_progress_schema" CHECK (("learn_app"."course_progress"."state"->>'schemaVersion' = '1') IS TRUE)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."published_courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'ar' NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "published_course_version" CHECK ("learn_app"."published_courses"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."published_lessons" (
	"course_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"lesson_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"revision" integer NOT NULL,
	"package" jsonb NOT NULL,
	"boards" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "published_lessons_course_id_version_lesson_id_pk" PRIMARY KEY("course_id","version","lesson_id"),
	CONSTRAINT "published_lesson_position" CHECK ("learn_app"."published_lessons"."position" >= 1)
);
--> statement-breakpoint
ALTER TABLE "learn_app"."course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_published_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "learn_app"."published_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."course_progress" ADD CONSTRAINT "course_progress_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "learn_app"."course_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD CONSTRAINT "published_courses_id_author_courses_id_fk" FOREIGN KEY ("id") REFERENCES "learn_app"."author_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."published_lessons" ADD CONSTRAINT "published_lessons_course_id_published_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "learn_app"."published_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_courses_owner" ON "learn_app"."published_courses" USING btree ("owner_id");--> statement-breakpoint
-- The runtime role publishes a teacher's course, lists it for students, enrols them and saves
-- their progress. Conditional so it also applies where the role does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT, UPDATE ON learn_app.published_courses TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.published_lessons TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.course_enrollments TO learn_app_reader;
    GRANT SELECT, INSERT, UPDATE ON learn_app.course_progress TO learn_app_reader;
  END IF;
END $$;
