import { existsSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

for (const file of [".env", ".env.local"]) {
  const envPath = path.join(process.cwd(), file);

  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: file === ".env.local" });
  }
}

// Prisma CLI commands like `db push` should use a direct database connection.
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
