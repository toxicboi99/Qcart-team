import prisma from "@/lib/prisma";
import { sendAccountCreatedEmail } from "@/lib/server/email";
import { errorResponse } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/serializers";
import {
  normalizeEmail,
  resolveRoleForEmail,
} from "@/lib/server/users";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const otp = String(body.otp || "").trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (!otp || user.otp !== otp) {
      return errorResponse("Invalid OTP");
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return errorResponse("OTP expired. Please request a new one.");
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
        role: resolveRoleForEmail(user.email, user.role),
      },
    });

    try {
      await sendAccountCreatedEmail(updatedUser.email, updatedUser.name);
    } catch (error) {
      console.error("Account created email send failed:", error);
    }

    return Response.json({
      message: "Account verified successfully",
      user: serializeUser(updatedUser),
    });
  } catch (error) {
    return errorResponse(error.message || "OTP verification failed", 400);
  }
}
