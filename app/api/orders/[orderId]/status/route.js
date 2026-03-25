import prisma from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/server/email";
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
      include: {
        user: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    if (order.status === status) {
      return Response.json({
        message: "Order status is already up to date",
        order: serializeOrder(order),
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
      },
    });

    let emailDelivered = false;

    if (order.user?.email) {
      try {
        const emailResult = await sendOrderStatusEmail({
          email: order.user.email,
          userName: order.user.name,
          previousStatus: order.status || "Pending",
          order: {
            ...updatedOrder,
            items: Array.isArray(order.items) ? order.items : [],
            address: order.address || {},
          },
        });

        emailDelivered = Boolean(emailResult?.delivered);
      } catch (emailError) {
        console.error("Order status email send failed:", emailError);
      }
    }

    return Response.json({
      message: "Order status updated successfully",
      order: serializeOrder(updatedOrder),
      emailDelivered,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update order status", 400);
  }
}
