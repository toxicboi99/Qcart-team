import { adminOnly } from "@/lib/server/middleware/access";
import { updateAdminOrderStatusController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  const { orderId } = await params;
  return updateAdminOrderStatusController(request, orderId);
}
