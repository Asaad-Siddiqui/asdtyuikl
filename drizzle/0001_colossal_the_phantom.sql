ALTER TABLE "accessibility_profiles" ADD COLUMN "mobility_detail" text;--> statement-breakpoint
ALTER TABLE "accessibility_profiles" ADD COLUMN "dietary_detail" text;--> statement-breakpoint
ALTER TABLE "accessibility_requirements" DROP COLUMN "detail";--> statement-breakpoint
ALTER TABLE "dietary_requirements" DROP COLUMN "detail";