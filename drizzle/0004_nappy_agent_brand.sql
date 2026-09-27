CREATE TABLE "business_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" text NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"category_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"destination_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"locality" text DEFAULT '' NOT NULL,
	"price_range" text DEFAULT '' NOT NULL,
	"accessibility_summary" text DEFAULT '' NOT NULL,
	"sustainability_practices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accessibility_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_assessments" ADD CONSTRAINT "business_assessments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_assessments" ADD CONSTRAINT "business_assessments_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_feedback" ADD CONSTRAINT "business_feedback_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_feedback" ADD CONSTRAINT "business_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_assessments_business_idx" ON "business_assessments" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_feedback_business_user_unique_idx" ON "business_feedback" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "business_feedback_business_idx" ON "business_feedback" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "businesses_destination_idx" ON "businesses" USING btree ("destination_id");