CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"from_location" text NOT NULL,
	"to_location" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"elderly" integer DEFAULT 0 NOT NULL,
	"mobility_support" integer DEFAULT 0 NOT NULL,
	"budget" integer DEFAULT 0 NOT NULL,
	"transport_preference" text DEFAULT '' NOT NULL,
	"priorities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"additional_preferences" text DEFAULT '' NOT NULL,
	"trip_needs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_option" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"total_cost" integer DEFAULT 0 NOT NULL,
	"estimated_co2" real DEFAULT 0 NOT NULL,
	"accessibility_score" integer DEFAULT 0 NOT NULL,
	"sustainability_score" integer DEFAULT 0 NOT NULL,
	"data_source" text DEFAULT 'prototype' NOT NULL,
	"engine" text DEFAULT 'prototype' NOT NULL,
	"itinerary_json" jsonb NOT NULL,
	"raw_itinerary_json" jsonb NOT NULL,
	"assumptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trips_user_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_user_created_idx" ON "trips" USING btree ("user_id","created_at");