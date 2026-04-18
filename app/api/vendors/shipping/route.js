import { vendorOnly } from "@/lib/server/middleware/access";
import { updateVendorShippingController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function PATCH(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return updateVendorShippingController(request, actor.id);
}
