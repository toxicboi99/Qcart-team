import { vendorOnly } from "@/lib/server/middleware/access";
import { updateVendorOrderController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { orderId } = await params;
  return updateVendorOrderController(request, orderId, actor.id);
}
