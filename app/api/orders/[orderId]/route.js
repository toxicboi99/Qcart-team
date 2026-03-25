import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

const VALID_PAYMENT_STATUSES = [
  "Pending",
  "Verification Pending",
  "Verified",
  "Rejected",
];

export async function PATCH(request, { params }) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const paymentStatus = String(body.paymentStatus || "").trim();

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return errorResponse("Invalid payment status");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    if (order.paymentStatus === paymentStatus) {
      return Response.json({
        message: "Payment status is already up to date",
        order: serializeOrder(order),
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
      },
      include: {
        user: true,
      },
    });

    return Response.json({
      message: "Payment status updated successfully",
      order: serializeOrder(updatedOrder),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update payment status", 400);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return Response.json({
      message: "Order deleted successfully",
      orderId,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to delete order", 400);
  }
}
