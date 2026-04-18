import { adminOnly } from "@/lib/server/middleware/access";
import { updateProductApprovalController } from "@/lib/server/controllers/admin.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  const { productId } = await params;
  return updateProductApprovalController(request, productId);
}
