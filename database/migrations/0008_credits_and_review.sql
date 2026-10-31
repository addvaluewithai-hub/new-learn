CREATE TABLE "learn_app"."course_access" (
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"source" text NOT NULL,
	"ref" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_access_user" UNIQUE("user_id","course_id"),
	CONSTRAINT "course_access_source" CHECK ("learn_app"."course_access"."source" in ('purchase','gift','staff'))
);
--> statement-breakpoint
CREATE TABLE "learn_app"."course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"ai_report" jsonb,
	"reviewer_id" text DEFAULT '' NOT NULL,
	"reviewer_name" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "course_review_version" UNIQUE("course_id","version"),
	CONSTRAINT "course_review_status" CHECK ("learn_app"."course_reviews"."status" in ('pending','approved','changes')),
	CONSTRAINT "course_review_price" CHECK ("learn_app"."course_reviews"."price_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "learn_app"."credit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"kind" text NOT NULL,
	"action" text DEFAULT '' NOT NULL,
	"ref" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_entry_once" UNIQUE("user_id","kind","ref"),
	CONSTRAINT "credit_entry_kind" CHECK ("learn_app"."credit_entries"."kind" in ('starter','grant','purchase','spend','refund')),
	CONSTRAINT "credit_entry_sign" CHECK (("learn_app"."credit_entries"."kind" = 'spend') = ("learn_app"."credit_entries"."amount" < 0))
);
--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD COLUMN "public_version" integer;--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD COLUMN "price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "learn_app"."course_access" ADD CONSTRAINT "course_access_course_id_published_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "learn_app"."published_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_app"."course_reviews" ADD CONSTRAINT "course_reviews_course_id_published_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "learn_app"."published_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_reviews_status" ON "learn_app"."course_reviews" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "credit_entries_user" ON "learn_app"."credit_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_entries_email" ON "learn_app"."credit_entries" USING btree ("user_email");--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD CONSTRAINT "published_course_price" CHECK ("learn_app"."published_courses"."price_cents" >= 0);--> statement-breakpoint
-- Every course published before reviews existed is free and stays as students see it now.
UPDATE "learn_app"."published_courses" SET "public_version" = "version" WHERE "public_version" IS NULL;--> statement-breakpoint
-- The runtime role keeps the credit ledger (insert-only), runs reviews and records access.
-- Conditional so it also applies where the role does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learn_app_reader') THEN
    GRANT SELECT, INSERT ON learn_app.credit_entries TO learn_app_reader;
    GRANT SELECT, INSERT, UPDATE ON learn_app.course_reviews TO learn_app_reader;
    GRANT SELECT, INSERT ON learn_app.course_access TO learn_app_reader;
  END IF;
END $$;
