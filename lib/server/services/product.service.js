import prisma from "@/lib/prisma";
import { parseJson, toNumber } from "@/lib/server/vendor";
import { uploadImages } from "@/lib/server/uploads";

const PRODUCT_IMAGE_LIMIT = 4;

function toVariants(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return parseJson(value, []);
}

function dedupeImages(images = []) {
  return Array.from(new Set(images.filter(Boolean)));
}

function buildOrderedImages({
  existingImages = [],
  uploadedImages = [],
  imageOrder = [],
} = {}) {
  const safeExistingImages = dedupeImages(existingImages);

  if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
    return dedupeImages([...safeExistingImages, ...uploadedImages]);
  }

  const orderedImages = imageOrder
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return "";
      }

      if (entry.type === "existing") {
        return safeExistingImages.includes(entry.value) ? entry.value : "";
      }

      if (entry.type === "upload") {
        const uploadIndex = Number(entry.value);
        return Number.isInteger(uploadIndex) ? uploadedImages[uploadIndex] || "" : "";
      }

      return "";
    })
    .filter(Boolean);

  return orderedImages.length > 0
    ? dedupeImages(orderedImages)
    : dedupeImages([...safeExistingImages, ...uploadedImages]);
}

function validateProductImages(images = []) {
  if (images.length === 0) {
    throw new Error("A main product image is required.");
  }

  if (images.length > PRODUCT_IMAGE_LIMIT) {
    throw new Error("You can upload up to 4 product images.");
  }
}

function buildPricing(payload = {}) {
  const price = Math.max(0, toNumber(payload.price));
  const discount = Math.max(0, Math.min(100, toNumber(payload.discount)));
  const computedOffer = Number((price - (price * discount) / 100).toFixed(2));
  const offerPrice = Math.max(
    0,
    toNumber(
      payload.offerPrice,
      Number.isFinite(computedOffer) ? computedOffer : price
    )
  );

  return {
    price,
    discount,
    offerPrice,
  };
}

export async function listProducts({
  category,
  includeUnapproved = false,
  vendorId,
} = {}) {
  const where = {
    ...(category ? { category } : {}),
    ...(vendorId ? { vendorId } : {}),
  };

  if (!includeUnapproved) {
    where.OR = [{ isApproved: true }, { vendorId: null }];
  }

  return prisma.product.findMany({
    where,
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id, { includeUnapproved = false } = {}) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  if (!includeUnapproved && product.vendorId && !product.isApproved) {
    return null;
  }

  return product;
}

function canManageProduct(actor, product) {
  if (!actor || !product) {
    return false;
  }

  if (actor.role === "admin") {
    return true;
  }

  return product.vendorId === actor.id || product.userId === actor.id;
}

export async function createProduct({
  actor,
  payload = {},
  files = [],
}) {
  const creatorId = actor?.id || String(payload.userId || "").trim();

  if (!creatorId) {
    throw new Error("Creator account is required.");
  }

  const creator = actor
    ? actor
    : await prisma.user.findUnique({
        where: { id: creatorId },
        include: { vendorProfile: true },
      });

  if (!creator) {
    throw new Error("Creator not found.");
  }

  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const category = String(payload.category || "").trim();
  const stock = Math.max(0, Math.floor(toNumber(payload.stock, 100)));
  const variants = toVariants(payload.variants);
  const uploadedImages = await uploadImages(files, {
    folder: "qcart/products",
  });
  const imageOrder = parseJson(payload.imageOrder, []);
  const images = buildOrderedImages({
    uploadedImages,
    imageOrder,
  });
  const pricing = buildPricing(payload);

  if (!name || !description || !category) {
    throw new Error("Product name, description, and category are required.");
  }

  validateProductImages(images);

  const vendorId =
    creator.isVendor || creator.role === "vendor" || creator.role === "seller"
      ? creator.id
      : String(payload.vendorId || "").trim() || null;

  return prisma.product.create({
    data: {
      userId: creator.id,
      vendorId,
      name,
      description,
      category,
      image: images,
      stock,
      variants,
      ...pricing,
      isApproved: creator.role === "admin" && !vendorId,
    },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });
}

export async function updateProduct({
  actor,
  productId,
  payload = {},
  files = [],
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!canManageProduct(actor, product)) {
    throw new Error("You do not have permission to update this product.");
  }

  const existingImages = Array.isArray(payload.existingImages)
    ? payload.existingImages
    : parseJson(payload.existingImages, product.image || []);
  const uploadedImages = await uploadImages(files, {
    folder: "qcart/products",
  });
  const imageOrder = parseJson(payload.imageOrder, []);
  const image = buildOrderedImages({
    existingImages,
    uploadedImages,
    imageOrder,
  });
  validateProductImages(image);

  const pricing = buildPricing({
    price: payload.price ?? product.price,
    discount: payload.discount ?? product.discount,
    offerPrice: payload.offerPrice ?? product.offerPrice,
  });

  return prisma.product.update({
    where: { id: productId },
    data: {
      name: String(payload.name || product.name).trim(),
      description: String(payload.description || product.description).trim(),
      category: String(payload.category || product.category).trim(),
      image,
      stock: Math.max(
        0,
        Math.floor(toNumber(payload.stock, Number(product.stock ?? 0)))
      ),
      variants:
        payload.variants === undefined ? product.variants : toVariants(payload.variants),
      ...pricing,
      isApproved: actor?.role === "admin" ? Boolean(product.isApproved) : false,
      approvalNotes:
        actor?.role === "admin" ? product.approvalNotes : "Awaiting re-approval after vendor update",
    },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });
}

export async function deleteProduct({ actor, productId }) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!canManageProduct(actor, product)) {
    throw new Error("You do not have permission to delete this product.");
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  return product;
}
