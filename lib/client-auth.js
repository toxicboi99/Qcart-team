import { getAdminSession, getUserSession } from "@/lib/session";

export function getClientSession(source = "user") {
  if (source === "admin") {
    return getAdminSession();
  }

  if (source === "any") {
    return getUserSession() || getAdminSession();
  }

  return getUserSession();
}

export function buildSessionHeaders(source = "user") {
  const session = getClientSession(source);

  if (!session?.user?._id) {
    return {};
  }

  return {
    "x-user-id": session.user._id,
    "x-user-role": session.user.role || "user",
  };
}
