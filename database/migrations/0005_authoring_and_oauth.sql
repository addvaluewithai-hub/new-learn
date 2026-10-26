CREATE TABLE "learn_app"."author_boards" (
	"hash" text NOT NULL,
	"owner_id" text NOT NULL,
	"board_id" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"files" jsonb NOT NULL,
	"size" integer NOT NULL,
	"reports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_boards_hash_owner_id_pk" PRIMARY KEY("hash","owner_id"),
	CONSTRAINT "author_board_hash" CHECK ("learn_app"."author_boards"."hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "learn_app"."author_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'ar' NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_app"."author_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"revision" integer NOT NULL,
	"scene_id" text NOT NULL,
	"phase" text NOT NULL,
	"step" integer NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"note" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_feedback_status" CHECK ("learn_app"."author_feedback"."status" in ('open','review','done','dismissed')),
	CONSTRAINT "author_feedback_kind" CHECK ("learn_app"."author_feedback"."kind" in ('text','board','question','translation'))
);
--> statement-breakpoint
CREATE TABLE "learn_app"."author_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_lesson_revision" CHECK ("learn_app"."author_lessons"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."author_lesson_revisions" (
	"lesson_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"source" jsonb NOT NULL,
	"package" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_lesson_revisions_lesson_id_revision_pk" PRIMARY KEY("lesson_id","revision"),
	CONSTRAINT "author_revision_positive" CHECK ("learn_app"."author_lesson_revisions"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"redirect_uris" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_app"."oauth_codes" (
	"hash" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learn_app"."oauth_tokens" (
	"hash" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learn_app"."author_feedback" ADD CONSTRAINT "author_feedback_lesson_id_author_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "learn_app"."author_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."author_lessons" ADD CONSTRAINT "author_lessons_course_id_author_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "learn_app"."author_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."author_lesson_revisions" ADD CONSTRAINT "author_lesson_revisions_lesson_id_author_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "learn_app"."author_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."oauth_codes" ADD CONSTRAINT "oauth_codes_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "learn_app"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "learn_app"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "author_boards_owner_board" ON "learn_app"."author_boards" USING btree ("owner_id","board_id");--> statement-breakpoint
CREATE INDEX "author_courses_owner" ON "learn_app"."author_courses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "author_feedback_lesson" ON "learn_app"."author_feedback" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "author_lessons_owner" ON "learn_app"."author_lessons" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "oauth_tokens_user" ON "learn_app"."oauth_tokens" USING btree ("user_id");--> statement-breakpoint
-- The runtime role writes teacher drafts and OAuth state; ownership is enforced by the API
-- (the owner always comes from the session or token). Revisions are insert-only, so any
-- saved version can be restored. The board site's role reads boards and nothing else.
-- Conditional so the migration also applies where the roles do not exist (tests, branches).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT, UPDATE ON learn_app.author_courses, learn_app.author_lessons,
      learn_app.author_boards, learn_app.author_feedback TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.author_lesson_revisions TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.oauth_clients TO learn_app_reader;
    GRANT SELECT, INSERT, UPDATE ON learn_app.oauth_codes, learn_app.oauth_tokens
      TO learn_app_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_board_reader') THEN
    GRANT USAGE ON SCHEMA learn_app TO learn_board_reader;
    GRANT SELECT (hash, files) ON learn_app.author_boards TO learn_board_reader;
  END IF;
END $$;
