-- Add custom_fields JSONB column to contacts table
ALTER TABLE "pg-drizzle_contact" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb;

-- Add custom_fields JSONB column to deals table  
ALTER TABLE "pg-drizzle_deal" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb;

-- Create custom_field_definitions table
CREATE TABLE IF NOT EXISTS "pg-drizzle_custom_field_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"created_by_id" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "custom_field_entity_idx" ON "pg-drizzle_custom_field_definition" ("entity_type","created_by_id");
CREATE INDEX IF NOT EXISTS "custom_field_key_idx" ON "pg-drizzle_custom_field_definition" ("field_key","entity_type","created_by_id");

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pg-drizzle_custom_field_definition_created_by_id_user_id_fk'
  ) THEN
    ALTER TABLE "pg-drizzle_custom_field_definition" 
    ADD CONSTRAINT "pg-drizzle_custom_field_definition_created_by_id_user_id_fk" 
    FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

