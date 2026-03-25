import prisma from "@/lib/prisma";

const parseEmailList = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function resolveRoleForEmail(email, fallbackRole = "user") {
  const normalizedEmail = normalizeEmail(email);
  const adminEmails = parseEmailList(process.env.ADMIN_EMAILS);
  const sellerEmails = parseEmailList(process.env.SELLER_EMAILS);

  if (adminEmails.includes(normalizedEmail)) {
    return "admin";
  }

  if (sellerEmails.includes(normalizedEmail)) {
    return "seller";
  }

  return fallbackRole || "user";
}

export async function syncRoleIfNeeded(user) {
  const nextRole = resolveRoleForEmail(user.email, user.role);

  if (nextRole === user.role) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { role: nextRole },
  });
}
