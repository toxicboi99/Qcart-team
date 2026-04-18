import { errorResponse } from "@/lib/server/http";
import { serializeReview } from "@/lib/server/serializers";
import {
  createReview,
  listProductReviews,
} from "@/lib/server/services/review.service";

export async function listProductReviewsController(productId) {
  try {
    const reviews = await listProductReviews(productId);
    return Response.json(reviews.map(serializeReview));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch reviews", 400);
  }
}

export async function createReviewController(request, productId) {
  try {
    const body = await request.json();
    const review = await createReview(productId, body);

    return Response.json(
      {
        message: "Review added successfully",
        review: serializeReview(review),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Failed to create review", 400);
  }
}
