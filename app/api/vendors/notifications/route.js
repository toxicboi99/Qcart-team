import { vendorOnly } from "@/lib/server/middleware/access";
import { updateVendorNotificationsController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function PATCH(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return updateVendorNotificationsController(request, actor.id);
}
