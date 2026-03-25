import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/serializers";
import { normalizeEmail, syncRoleIfNeeded } from "@/lib/server/users";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    if (!user.isVerified) {
      return errorResponse(
        "Please verify your account first. Check your email for the OTP.",
        401
      );
    }

    const matches = await bcrypt.compare(password, user.password);

    if (!matches) {
      return errorResponse("Invalid email or password", 401);
    }

    const syncedUser = await syncRoleIfNeeded(user);

    return Response.json({
      message: "Sign in successful",
      user: serializeUser(syncedUser),
    });
  } catch (error) {
    return errorResponse(error.message || "Sign in failed", 400);
  }
}
