ALTER TABLE "learn_app"."course_reviews" DROP CONSTRAINT "course_review_price";--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD COLUMN "listing" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD COLUMN "grade" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "published_courses_listed" ON "learn_app"."published_courses" USING btree ("listing","published_at");--> statement-breakpoint
ALTER TABLE "learn_app"."published_courses" ADD CONSTRAINT "published_course_listing" CHECK ("learn_app"."published_courses"."listing" in ('private','requested','listed'));--> statement-breakpoint
ALTER TABLE "learn_app"."course_reviews" ADD CONSTRAINT "course_review_price" CHECK ("learn_app"."course_reviews"."price_cents" >= 0);