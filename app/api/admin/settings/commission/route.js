import { adminOnly } from "@/lib/server/middleware/access";
import {
  getDefaultCommissionController,
  updateDefaultCommissionController,
} from "@/lib/server/controllers/admin.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  return getDefaultCommissionController();
}

export async function PATCH(request) {
  const { response } = await adminOnly(request);

  if (response) {
    return response;
  }

  return updateDefaultCommissionController(request);
}
