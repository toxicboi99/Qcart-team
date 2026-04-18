import { vendorOnly } from "@/lib/server/middleware/access";
import { replyToReviewController } from "@/lib/server/controllers/vendor.controller";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { actor, response } = await vendorOnly(request);

  if (response) {
    return response;
  }

  const { reviewId } = await params;
  return replyToReviewController(request, actor.id, reviewId);
}
