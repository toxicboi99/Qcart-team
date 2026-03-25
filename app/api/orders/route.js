import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = String(body.userId || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const amount = Number(body.amount);
    const address = body.address;

    if (
      !userId ||
      items.length === 0 ||
      !Number.isFinite(amount) ||
      !address ||
      typeof address !== "object"
    ) {
      return errorResponse(
        "All fields are required (userId, items, amount, address)"
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        amount,
        address,
        status: "Pending",
        paymentMethod: body.paymentMethod || "COD",
        paymentStatus: body.paymentStatus || "Pending",
      },
    });

    return Response.json(
      {
        message: "Order created successfully",
        order: serializeOrder(order),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Failed to create order", 400);
  }
}
