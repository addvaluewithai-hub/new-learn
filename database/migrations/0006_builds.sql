CREATE TABLE "learn_app"."build_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_app"."build_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"request" jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text DEFAULT '' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "build_job_status" CHECK ("learn_app"."build_jobs"."status" in ('queued','running','done','failed'))
);
--> statement-breakpoint
ALTER TABLE "learn_app"."build_files" ADD CONSTRAINT "build_files_job_id_build_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "learn_app"."build_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_files_job" ON "learn_app"."build_files" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "build_jobs_owner" ON "learn_app"."build_jobs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "build_jobs_status" ON "learn_app"."build_jobs" USING btree ("status","created_at");--> statement-breakpoint
-- The runtime role creates jobs for the signed-in teacher and lets the builder worker (via the
-- app's API, with its own token) claim them, report steps and finish. Uploads are read by the
-- worker through the same API. Conditional so it also applies where the role does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT, UPDATE ON learn_app.build_jobs TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.build_files TO learn_app_reader;
  END IF;
END $$;
