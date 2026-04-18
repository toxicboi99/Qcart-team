import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { isAdminRole, isVendorRole } from "@/lib/server/vendor";

function getHeader(request, name) {
  return String(request.headers.get(name) || "").trim();
}

export async function getRequestActor(request) {
  const userId = getHeader(request, "x-user-id");

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendorProfile: true,
    },
  });

  if (!user) {
    return null;
  }

  const roleHeader = getHeader(request, "x-user-role").toLowerCase();

  if (roleHeader) {
    const normalizedRole = String(user.role || "").toLowerCase();
    const roleMatches =
      roleHeader === normalizedRole ||
      (roleHeader === "vendor" && isVendorRole(normalizedRole));

    if (!roleMatches) {
      return null;
    }
  }

  return user;
}

export async function requireActor(request) {
  const actor = await getRequestActor(request);

  if (!actor) {
    return {
      actor: null,
      response: errorResponse("Authentication required", 401),
    };
  }

  return { actor, response: null };
}

export async function requireAdminActor(request) {
  const { actor, response } = await requireActor(request);

  if (response) {
    return { actor: null, response };
  }

  if (!isAdminRole(actor.role)) {
    return {
      actor: null,
      response: errorResponse("Admin access only", 403),
    };
  }

  return { actor, response: null };
}

export async function requireVendorActor(request) {
  const { actor, response } = await requireActor(request);

  if (response) {
    return { actor: null, response };
  }

  if (!isVendorRole(actor.role) && !actor.isVendor) {
    return {
      actor: null,
      response: errorResponse("Vendor access only", 403),
    };
  }

  if (actor.isBlocked) {
    return {
      actor: null,
      response: errorResponse("Vendor account is blocked", 403),
    };
  }

  return { actor, response: null };
}
