CREATE TABLE "pg-drizzle_deal_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pg-drizzle_deal" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stage" text NOT NULL,
	"value" text,
	"currency" text,
	"expected_close_date" timestamp with time zone,
	"notes" text,
	"created_by_id" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DROP TABLE "pg-drizzle_post" CASCADE;--> statement-breakpoint
ALTER TABLE "pg-drizzle_deal_contact" ADD CONSTRAINT "pg-drizzle_deal_contact_deal_id_pg-drizzle_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."pg-drizzle_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_deal_contact" ADD CONSTRAINT "pg-drizzle_deal_contact_contact_id_pg-drizzle_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."pg-drizzle_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_deal" ADD CONSTRAINT "pg-drizzle_deal_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deal_contact_deal_idx" ON "pg-drizzle_deal_contact" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_contact_contact_idx" ON "pg-drizzle_deal_contact" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deal_created_by_idx" ON "pg-drizzle_deal" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "deal_stage_idx" ON "pg-drizzle_deal" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "deal_name_idx" ON "pg-drizzle_deal" USING btree ("name");