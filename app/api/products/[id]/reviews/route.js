import {
  createReviewController,
  listProductReviewsController,
} from "@/lib/server/controllers/review.controller";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  return listProductReviewsController(id);
}

export async function POST(request, { params }) {
  const { id } = await params;
  return createReviewController(request, id);
}
