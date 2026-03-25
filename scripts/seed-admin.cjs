const fs = require("node:fs");
const path = require("node:path");

const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { config: loadEnv } = require("dotenv");
const { PrismaClient } = require("@prisma/client");

for (const file of [".env", ".env.local"]) {
  const envPath = path.join(process.cwd(), file);

  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: file === ".env.local" });
  }
}

function parseEmailList(value = "") {
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const adminEmails = parseEmailList(process.env.ADMIN_EMAILS);
  const email =
    process.env.ADMIN_DEFAULT_EMAIL ||
    adminEmails[0] ||
    "admin@example.com";
  const password = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@123";
  const name = process.env.ADMIN_DEFAULT_NAME || "Admin User";
  const phoneNumber = process.env.ADMIN_DEFAULT_PHONE || "9999999999";
  const connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL is required.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        phoneNumber,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
      create: {
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      },
    });

    console.log("Admin user is ready.");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
