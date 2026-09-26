CREATE TABLE "accessibility_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accessibility_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"category" text NOT NULL,
	"requirement" text NOT NULL,
	"selected" boolean DEFAULT true NOT NULL,
	"detail" text
);
--> statement-breakpoint
CREATE TABLE "dietary_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"requirement" text NOT NULL,
	"detail" text
);
--> statement-breakpoint
CREATE TABLE "special_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"sustainability_weight" integer DEFAULT 50 NOT NULL,
	"accessibility_weight" integer DEFAULT 50 NOT NULL,
	"budget_weight" integer DEFAULT 50 NOT NULL,
	"time_weight" integer DEFAULT 50 NOT NULL,
	"comfort_weight" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traveler_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accessibility_profiles" ADD CONSTRAINT "accessibility_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accessibility_requirements" ADD CONSTRAINT "accessibility_requirements_profile_id_accessibility_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."accessibility_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_requirements" ADD CONSTRAINT "dietary_requirements_profile_id_accessibility_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."accessibility_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_requirements" ADD CONSTRAINT "special_requirements_profile_id_accessibility_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."accessibility_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_preferences" ADD CONSTRAINT "travel_preferences_profile_id_accessibility_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."accessibility_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traveler_types" ADD CONSTRAINT "traveler_types_profile_id_accessibility_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."accessibility_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accessibility_profiles_user_unique_idx" ON "accessibility_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accessibility_requirements_unique_idx" ON "accessibility_requirements" USING btree ("profile_id","category","requirement");--> statement-breakpoint
CREATE INDEX "accessibility_requirements_profile_idx" ON "accessibility_requirements" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dietary_requirements_profile_requirement_unique_idx" ON "dietary_requirements" USING btree ("profile_id","requirement");--> statement-breakpoint
CREATE INDEX "dietary_requirements_profile_idx" ON "dietary_requirements" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "special_requirements_profile_idx" ON "special_requirements" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "travel_preferences_profile_unique_idx" ON "travel_preferences" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "traveler_types_profile_type_unique_idx" ON "traveler_types" USING btree ("profile_id","type");--> statement-breakpoint
CREATE INDEX "traveler_types_profile_idx" ON "traveler_types" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");