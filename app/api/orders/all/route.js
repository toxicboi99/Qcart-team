import { adminOnly } from "@/lib/server/middleware/access";
import { listAllOrdersController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  return listAllOrdersController();
}
