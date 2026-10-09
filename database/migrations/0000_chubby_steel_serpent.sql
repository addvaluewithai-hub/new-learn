CREATE SCHEMA "learn_app";
--> statement-breakpoint
CREATE TABLE "learn_app"."curricula" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject" text NOT NULL,
	"visibility" text DEFAULT 'draft' NOT NULL,
	CONSTRAINT "curriculum_visibility" CHECK ("learn_app"."curricula"."visibility" in ('draft','published','archived'))
);
--> statement-breakpoint
CREATE TABLE "learn_app"."lesson_editions" (
	"lesson_id" text NOT NULL,
	"content_revision" text NOT NULL,
	"module_id" text NOT NULL,
	"manifest_hash" text NOT NULL,
	"runtime_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_editions_lesson_id_content_revision_pk" PRIMARY KEY("lesson_id","content_revision"),
	CONSTRAINT "edition_hash" CHECK ("learn_app"."lesson_editions"."manifest_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "learn_app"."lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"curriculum_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	CONSTRAINT "lesson_position" UNIQUE("curriculum_id","position"),
	CONSTRAINT "positive_position" CHECK ("learn_app"."lessons"."position">0)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."lesson_releases" (
	"lesson_id" text PRIMARY KEY NOT NULL,
	"content_revision" text NOT NULL,
	"stage" text NOT NULL,
	"released_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "release_stage" CHECK ("learn_app"."lesson_releases"."stage" in ('review','published'))
);
--> statement-breakpoint
CREATE TABLE "learn_app"."lesson_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"content_revision" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lesson" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "learn_app"."lesson_progress" (
	"enrollment_id" uuid PRIMARY KEY NOT NULL,
	"state" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_revision" CHECK ("learn_app"."lesson_progress"."revision" >= 0),
	CONSTRAINT "progress_schema" CHECK (("learn_app"."lesson_progress"."state"->>'schemaVersion' = '1') IS TRUE)
);
--> statement-breakpoint
ALTER TABLE "learn_app"."lesson_editions" ADD CONSTRAINT "lesson_editions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "learn_app"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."lessons" ADD CONSTRAINT "lessons_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "learn_app"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."lesson_releases" ADD CONSTRAINT "lesson_releases_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "learn_app"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."lesson_releases" ADD CONSTRAINT "lesson_releases_lesson_id_content_revision_lesson_editions_lesson_id_content_revision_fk" FOREIGN KEY ("lesson_id","content_revision") REFERENCES "learn_app"."lesson_editions"("lesson_id","content_revision") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."lesson_enrollments" ADD CONSTRAINT "lesson_enrollments_lesson_id_content_revision_lesson_editions_lesson_id_content_revision_fk" FOREIGN KEY ("lesson_id","content_revision") REFERENCES "learn_app"."lesson_editions"("lesson_id","content_revision") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_lesson_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "learn_app"."lesson_enrollments"("id") ON DELETE no action ON UPDATE no action;