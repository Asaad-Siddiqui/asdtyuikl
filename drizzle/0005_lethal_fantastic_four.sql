CREATE TABLE "reward_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" text NOT NULL,
	"reward_name" text NOT NULL,
	"points_at_claim" integer DEFAULT 0 NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reward_claims_user_reward_unique_idx" ON "reward_claims" USING btree ("user_id","reward_id");--> statement-breakpoint
CREATE INDEX "reward_claims_user_idx" ON "reward_claims" USING btree ("user_id");