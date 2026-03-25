import prisma from "@/lib/prisma";
import { filesToDataUrls } from "@/lib/server/images";
import { errorResponse } from "@/lib/server/http";
import { serializeProduct } from "@/lib/server/serializers";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(products.map(serializeProduct));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch products", 500);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const price = Number(formData.get("price"));
    const offerPrice = Number(formData.get("offerPrice"));
    const userId = String(formData.get("userId") || "").trim();

    if (
      !name ||
      !description ||
      !category ||
      !userId ||
      !Number.isFinite(price) ||
      !Number.isFinite(offerPrice)
    ) {
      return errorResponse("All fields are required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const images = await filesToDataUrls(formData.getAll("images"));

    if (images.length === 0) {
      return errorResponse("At least one product image is required");
    }

    const product = await prisma.product.create({
      data: {
        userId,
        name,
        description,
        price,
        offerPrice,
        image: images,
        category,
      },
    });

    return Response.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    return errorResponse(error.message || "Failed to create product", 400);
  }
}
