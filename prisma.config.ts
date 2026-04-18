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

function resolvePrismaCliUrl(value = "") {
  if (!value) {
    return "";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    return value;
  }

  const isSupabasePooler = parsedUrl.hostname.endsWith(".pooler.supabase.com");

  if (!isSupabasePooler) {
    return value;
  }

  // Prisma CLI works with Supavisor session mode, which is the safer fallback
  // when a direct IPv6 host is unavailable from the local network.
  parsedUrl.port = "5432";
  parsedUrl.searchParams.delete("pgbouncer");
  parsedUrl.searchParams.delete("connection_limit");

  return parsedUrl.toString();
}

// Prisma CLI commands like `db push` should prefer an explicit DIRECT_URL.
const databaseUrl =
  process.env.DIRECT_URL || resolvePrismaCliUrl(process.env.DATABASE_URL || "");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
