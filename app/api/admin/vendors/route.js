import { adminOnly } from "@/lib/server/middleware/access";
import { listVendorsController } from "@/lib/server/controllers/admin.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  return listVendorsController();
}
