import { vendorOnly } from "@/lib/server/middleware/access";
import { getVendorDashboardController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return getVendorDashboardController(actor.id);
}
