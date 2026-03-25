import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeContact } from "@/lib/server/serializers";
import { normalizeEmail } from "@/lib/server/users";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const type = String(body.type || "").trim();
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const phoneNumber = String(body.phoneNumber || "").trim();
    const message = String(body.message || "").trim();

    if (!type || !name || !email) {
      return errorResponse("Type, name, and email are required");
    }

    if (!["sales", "support"].includes(type)) {
      return errorResponse("Type must be sales or support");
    }

    const contact = await prisma.contact.create({
      data: {
        type,
        name,
        email,
        phoneNumber,
        message,
      },
    });

    return Response.json(
      {
        message: "Contact request received",
        contact: serializeContact(contact),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Failed to submit contact", 400);
  }
}
