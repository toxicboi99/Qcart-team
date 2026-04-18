import { vendorOnly } from "@/lib/server/middleware/access";
import {
  createProductController,
  getProductsController,
} from "@/lib/server/controllers/product.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  return getProductsController(request, actor, {
    vendorId: actor.id,
    includeUnapproved: true,
  });
}

export async function POST(request) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  if (!actor.isApproved) {
    return Response.json(
      { error: "Vendor approval is pending. Products can be added after approval." },
      { status: 403 }
    );
  }

  return createProductController(request, actor);
}
