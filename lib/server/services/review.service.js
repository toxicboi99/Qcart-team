import prisma from "@/lib/prisma";

export async function listProductReviews(productId) {
  return prisma.review.findMany({
    where: { productId },
    include: {
      author: {
        include: {
          vendorProfile: true,
        },
      },
      product: {
        include: {
          vendor: {
            include: {
              vendorProfile: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview(productId, payload = {}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  const rating = Math.max(1, Math.min(5, Number(payload.rating || 0)));
  const comment = String(payload.comment || "").trim();
  const userId = String(payload.userId || "").trim() || null;

  if (!comment) {
    throw new Error("Review comment is required.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const review = await prisma.review.create({
    data: {
      productId,
      vendorId: product.vendorId || product.userId,
      userId,
      rating,
      comment,
    },
    include: {
      author: {
        include: {
          vendorProfile: true,
        },
      },
      product: {
        include: {
          vendor: {
            include: {
              vendorProfile: true,
            },
          },
        },
      },
    },
  });

  return review;
}
