import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

const VALID_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];

export async function PATCH(request, { params }) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const status = String(body.status || "").trim();

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse("Invalid order status");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return Response.json({
      message: "Order status updated successfully",
      order: serializeOrder(updatedOrder),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update order status", 400);
  }
}
