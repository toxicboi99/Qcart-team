import { adminOnly } from "@/lib/server/middleware/access";
import {
  deleteOrderController,
  updateOrderPaymentStatusController,
} from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  const { orderId } = await params;
  return updateOrderPaymentStatusController(request, orderId);
}

export async function DELETE(request, { params }) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  const { orderId } = await params;
  return deleteOrderController(orderId);
}
