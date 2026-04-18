import { adminOnly } from "@/lib/server/middleware/access";
import { updateVendorCommissionController } from "@/lib/server/controllers/admin.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  const { vendorId } = await params;
  return updateVendorCommissionController(request, vendorId);
}
