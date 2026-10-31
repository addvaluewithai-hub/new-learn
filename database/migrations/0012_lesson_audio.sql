CREATE TABLE "learn_app"."lesson_audio" (
	"hash" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"seconds" real NOT NULL,
	"words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"heard" text DEFAULT '' NOT NULL,
	"score" real,
	"flagged" boolean DEFAULT false NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lesson_audio_owner" ON "learn_app"."lesson_audio" USING btree ("owner_id");