import prisma from "@/lib/prisma";
import { uploadImageFileToCloudinary } from "@/lib/server/cloudinary";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

const VALID_PAYMENT_METHODS = ["COD", "PhonePe", "Google Pay", "Paytm"];

function isUploadFile(value) {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function parseJsonString(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

async function parseOrderPayload(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      userId: String(formData.get("userId") || "").trim(),
      items: parseJsonString(formData.get("items"), []),
      amount: Number(formData.get("amount")),
      address: parseJsonString(formData.get("address"), null),
      paymentMethod: String(formData.get("paymentMethod") || "COD").trim(),
      paymentStatus: String(formData.get("paymentStatus") || "").trim(),
      paymentScreenshot: formData.get("paymentScreenshot"),
    };
  }

  const body = await request.json();

  return {
    userId: String(body.userId || "").trim(),
    items: Array.isArray(body.items) ? body.items : [],
    amount: Number(body.amount),
    address: body.address,
    paymentMethod: String(body.paymentMethod || "COD").trim(),
    paymentStatus: String(body.paymentStatus || "").trim(),
    paymentScreenshot: null,
  };
}

export async function POST(request) {
  try {
    const {
      userId,
      items,
      amount,
      address,
      paymentMethod,
      paymentStatus,
      paymentScreenshot,
    } = await parseOrderPayload(request);

    if (
      !userId ||
      items.length === 0 ||
      !Number.isFinite(amount) ||
      !address ||
      typeof address !== "object"
    ) {
      return errorResponse(
        "All fields are required (userId, items, amount, address)"
      );
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return errorResponse("Invalid payment method");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const requiresScreenshot = paymentMethod !== "COD";

    if (requiresScreenshot && !isUploadFile(paymentScreenshot)) {
      return errorResponse("Payment screenshot is required for online payments");
    }

    const uploadedScreenshot = isUploadFile(paymentScreenshot)
      ? await uploadImageFileToCloudinary(paymentScreenshot, {
          folder: "qcart/order-payment-screenshots",
        })
      : null;

    const addressSnapshot = {
      fullName: String(address.fullName || "").trim(),
      phoneNumber: String(address.phoneNumber || "").trim(),
      pincode: String(address.pincode || "").trim(),
      area: String(address.area || "").trim(),
      city: String(address.city || "").trim(),
      state: String(address.state || "").trim(),
      email: user.email,
      paymentScreenshotUrl: uploadedScreenshot?.secureUrl || "",
      paymentScreenshotPublicId: uploadedScreenshot?.publicId || "",
    };

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        amount,
        address: addressSnapshot,
        status: "Pending",
        paymentMethod,
        paymentStatus:
          paymentStatus ||
          (requiresScreenshot ? "Verification Pending" : "Pending"),
      },
      include: {
        user: true,
      },
    });

    return Response.json(
      {
        message: "Order created successfully",
        order: serializeOrder(order),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Failed to create order", 400);
  }
}
