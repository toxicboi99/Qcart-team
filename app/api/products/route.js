import { getRequestActor } from "@/lib/server/auth";
import {
  createProductController,
  getProductsController,
} from "@/lib/server/controllers/product.controller";

export const runtime = "nodejs";

export async function GET(request) {
  const actor = await getRequestActor(request);
  return getProductsController(request, actor);
}

export async function POST(request) {
  const actor = await getRequestActor(request);
  return createProductController(request, actor);
}
