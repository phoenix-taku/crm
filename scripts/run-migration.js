import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const equalIndex = trimmed.indexOf("=");
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed
          .substring(equalIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.warn("Could not load .env file, using environment variables");
  }
}

loadEnv();

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  console.error("Please make sure your .env file contains DATABASE_URL");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function runMigration() {
  try {
    console.log("Reading migration file...");
    const migrationSQL = readFileSync(
      join(__dirname, "..", "drizzle", "0001_add_deals_table.sql"),
      "utf-8",
    );

    // Remove comments and split by semicolons, then filter out empty statements
    const cleanedSQL = migrationSQL
      .split("\n")
      .map((line) => {
        // Remove inline comments (-- comments)
        const commentIndex = line.indexOf("--");
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .filter((line) => line.length > 0 && !line.startsWith("--"))
      .join("\n");

    // Split by semicolons to get individual statements
    const statements = cleanedSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await sql.unsafe(statement + ";");
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;

    console.error("Migration failed:", errorMessage);
    if (errorCode) {
      console.error("Error code:", errorCode);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
