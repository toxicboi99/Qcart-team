import { createOrderController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function POST(request) {
  return createOrderController(request);
}
