import { errorResponse } from "@/lib/server/http";
import { parseRequestData } from "@/lib/server/request";
import { serializeProduct } from "@/lib/server/serializers";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "@/lib/server/services/product.service";

export async function getProductsController(request, actor = null, overrides = {}) {
  try {
    const { searchParams } = new URL(request.url);
    const category = overrides.category ?? searchParams.get("category");
    const vendorId = overrides.vendorId ?? searchParams.get("vendorId");
    const includeUnapproved =
      overrides.includeUnapproved ??
      (searchParams.get("includeUnapproved") === "true" &&
        (actor?.role === "admin" || actor?.id === vendorId));
    const products = await listProducts({
      category,
      vendorId: vendorId || undefined,
      includeUnapproved,
    });

    return Response.json(products.map(serializeProduct));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch products", 500);
  }
}

export async function getProductController(productId, actor = null, options = {}) {
  try {
    const product = await getProductById(productId, {
      includeUnapproved: actor?.role === "admin" || actor?.isVendor,
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    if (
      options.ownerOnly &&
      actor?.role !== "admin" &&
      product.vendorId !== actor?.id &&
      product.userId !== actor?.id
    ) {
      return errorResponse("Product not found", 404);
    }

    return Response.json(serializeProduct(product));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch product", 500);
  }
}

export async function createProductController(request, actor = null) {
  try {
    const { data, formData } = await parseRequestData(request);
    const files = formData ? formData.getAll("images") : [];
    const product = await createProduct({
      actor,
      payload: data,
      files,
    });

    return Response.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    return errorResponse(error.message || "Failed to create product", 400);
  }
}

export async function updateProductController(request, productId, actor) {
  try {
    const { data, formData } = await parseRequestData(request);
    const files = formData ? formData.getAll("images") : [];
    const product = await updateProduct({
      actor,
      productId,
      payload: data,
      files,
    });

    return Response.json(serializeProduct(product));
  } catch (error) {
    return errorResponse(error.message || "Failed to update product", 400);
  }
}

export async function deleteProductController(productId, actor) {
  try {
    await deleteProduct({
      actor,
      productId,
    });

    return Response.json({ message: "Product deleted successfully" });
  } catch (error) {
    return errorResponse(error.message || "Failed to delete product", 400);
  }
}
