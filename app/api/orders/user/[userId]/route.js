import { listUserOrdersController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { userId } = await params;
  return listUserOrdersController(userId);
}
