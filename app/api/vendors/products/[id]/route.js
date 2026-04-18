import { vendorOnly } from "@/lib/server/middleware/access";
import {
  deleteProductController,
  getProductController,
  updateProductController,
} from "@/lib/server/controllers/product.controller";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { id } = await params;
  return getProductController(id, actor, {
    ownerOnly: true,
  });
}

export async function PUT(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { id } = await params;
  return updateProductController(request, id, actor);
}

export async function DELETE(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { id } = await params;
  return deleteProductController(id, actor);
}
