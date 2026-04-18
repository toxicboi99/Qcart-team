import { getRequestActor } from "@/lib/server/auth";
import {
  deleteProductController,
  getProductController,
  updateProductController,
} from "@/lib/server/controllers/product.controller";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const actor = await getRequestActor(request);
  const { id } = await params;
  return getProductController(id, actor);
}

export async function PUT(request, { params }) {
  const actor = await getRequestActor(request);
  const { id } = await params;
  return updateProductController(request, id, actor);
}

export async function DELETE(request, { params }) {
  const actor = await getRequestActor(request);
  const { id } = await params;
  return deleteProductController(id, actor);
}
