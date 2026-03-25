import prisma from "@/lib/prisma";
import { filesToDataUrls } from "@/lib/server/images";
import { errorResponse } from "@/lib/server/http";
import { serializeProduct } from "@/lib/server/serializers";

export const runtime = "nodejs";

const parseExistingImages = (value) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
  } catch {
    return null;
  }
};

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return Response.json(serializeProduct(product));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch product", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return errorResponse("Product not found", 404);
    }

    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const price = Number(formData.get("price"));
    const offerPrice = Number(formData.get("offerPrice"));
    const parsedExistingImages = parseExistingImages(formData.get("existingImages"));
    const newImages = await filesToDataUrls(formData.getAll("images"));
    const image = [...(parsedExistingImages ?? existingProduct.image ?? []), ...newImages];

    if (
      !name ||
      !description ||
      !category ||
      !Number.isFinite(price) ||
      !Number.isFinite(offerPrice)
    ) {
      return errorResponse("All fields are required");
    }

    if (image.length === 0) {
      return errorResponse("At least one product image is required");
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        price,
        offerPrice,
        image,
      },
    });

    return Response.json(serializeProduct(product));
  } catch (error) {
    return errorResponse(error.message || "Failed to update product", 400);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    await prisma.product.delete({
      where: { id },
    });

    return Response.json({ message: "Product deleted successfully" });
  } catch (error) {
    return errorResponse(error.message || "Failed to delete product", 500);
  }
}
