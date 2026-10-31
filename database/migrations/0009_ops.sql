CREATE TABLE "learn_app"."error_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"place" text DEFAULT '' NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_id" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_app"."rate_hits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_hits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "learn_app"."usage_daily" (
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_daily_day_kind_pk" PRIMARY KEY("day","kind")
);
--> statement-breakpoint
CREATE INDEX "error_log_at" ON "learn_app"."error_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "rate_hits_window" ON "learn_app"."rate_hits" USING btree ("window_start");--> statement-breakpoint
-- The runtime role counts requests (and clears old windows), writes the error log and counts
-- daily usage. Conditional so it also applies where the role does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON learn_app.rate_hits TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.error_log TO learn_app_reader;
    GRANT SELECT, INSERT, UPDATE ON learn_app.usage_daily TO learn_app_reader;
  END IF;
END $$;
