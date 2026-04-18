import { vendorOnly } from "@/lib/server/middleware/access";
import { listVendorOrdersController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return listVendorOrdersController(actor.id);
}
