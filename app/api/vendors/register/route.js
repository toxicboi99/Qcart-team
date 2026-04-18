import { registerVendorController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function POST(request) {
  return registerVendorController(request);
}
