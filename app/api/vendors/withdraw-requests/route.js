import { vendorOnly } from "@/lib/server/middleware/access";
import { createWithdrawRequestController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function POST(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return createWithdrawRequestController(request, actor.id);
}
