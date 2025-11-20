import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function runMigration() {
  const sqlClient = postgres(databaseUrl);

  try {
    console.log("Reading migration file...");
    const migrationPath = join(__dirname, "..", "drizzle", "0004_add_custom_fields.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("Applying custom fields migration...");
    await sqlClient.unsafe(sql);

    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    process.exit(1);
  } finally {
    await sqlClient.end();
  }
}

runMigration();

