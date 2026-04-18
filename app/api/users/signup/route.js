import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/server/email";
import { errorResponse } from "@/lib/server/http";
import {
  generateOtp,
  normalizeEmail,
  resolveRoleForEmail,
} from "@/lib/server/users";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phoneNumber = String(body.phoneNumber || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!name || !phoneNumber || !email || !password) {
      return errorResponse("All fields are required");
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse("Passwords do not match");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.isVerified) {
      return errorResponse("User already exists");
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = resolveRoleForEmail(email, existingUser?.role);

    const user = existingUser
      ? await prisma.user.update({
          where: { email },
          data: {
            name,
            phoneNumber,
            password: hashedPassword,
            otp,
            otpExpiry,
            role,
            isVerified: false,
          },
        })
      : await prisma.user.create({
          data: {
            name,
            phoneNumber,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            role,
            isVerified: false,
          },
        });

    await sendVerificationEmail(email, otp);

    return Response.json(
      {
        message: existingUser
          ? "OTP re-sent to your email address"
          : "OTP sent to your email address",
        userId: user.id,
      },
      { status: existingUser ? 200 : 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Signup failed", error.statusCode || 400);
  }
}
