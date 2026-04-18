import { vendorOnly } from "@/lib/server/middleware/access";
import { generateVendorInvoiceController } from "@/lib/server/controllers/order.controller";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { orderId } = await params;
  return generateVendorInvoiceController(orderId, actor.id);
}
