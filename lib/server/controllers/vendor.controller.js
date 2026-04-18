import { errorResponse } from "@/lib/server/http";
import { parseRequestData } from "@/lib/server/request";
import {
  serializeReview,
  serializeUser,
  serializeVendorDashboard,
  serializeVendorProfile,
  serializeWithdrawRequest,
} from "@/lib/server/serializers";
import {
  createWithdrawRequest,
  getVendorDashboardData,
  registerVendor,
  replyToReview,
  updateVendorNotifications,
  updateVendorShipping,
  updateVendorStore,
} from "@/lib/server/services/vendor.service";
import { uploadSingleImage } from "@/lib/server/uploads";

export async function registerVendorController(request) {
  try {
    const { data, formData } = await parseRequestData(request);
    const logo =
      data.logo ||
      (formData
        ? await uploadSingleImage(formData.get("logo"), {
            folder: "qcart/vendors/logo",
          })
        : "");
    const banner =
      data.banner ||
      (formData
        ? await uploadSingleImage(formData.get("banner"), {
            folder: "qcart/vendors/banner",
          })
        : "");
    const result = await registerVendor({
      ...data,
      logo,
      banner,
    });

    return Response.json(
      {
        message: "Vendor registration submitted successfully",
        user: serializeUser(result.user),
        vendorProfile: serializeVendorProfile(result.profile),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error.message || "Vendor registration failed",
      error.statusCode || 400
    );
  }
}

export async function getVendorDashboardController(vendorId) {
  try {
    const dashboard = await getVendorDashboardData(vendorId);
    return Response.json(serializeVendorDashboard(dashboard));
  } catch (error) {
    return errorResponse(error.message || "Failed to load vendor dashboard", 400);
  }
}

export async function updateVendorStoreController(request, vendorId) {
  try {
    const { data, formData } = await parseRequestData(request);
    const logo =
      formData?.get("logo") &&
      typeof File !== "undefined" &&
      formData.get("logo") instanceof File &&
      formData.get("logo").size > 0
        ? await uploadSingleImage(formData.get("logo"), {
            folder: "qcart/vendors/logo",
          })
        : data.logo;
    const banner =
      formData?.get("banner") &&
      typeof File !== "undefined" &&
      formData.get("banner") instanceof File &&
      formData.get("banner").size > 0
        ? await uploadSingleImage(formData.get("banner"), {
            folder: "qcart/vendors/banner",
          })
        : data.banner;
    const profile = await updateVendorStore(vendorId, {
      ...data,
      ...(logo ? { logo } : {}),
      ...(banner !== undefined ? { banner } : {}),
    });

    return Response.json({
      message: "Store information updated successfully",
      vendorProfile: serializeVendorProfile(profile),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update store information", 400);
  }
}

export async function updateVendorShippingController(request, vendorId) {
  try {
    const body = await request.json();
    const profile = await updateVendorShipping(vendorId, body);
    return Response.json({
      message: "Shipping settings updated successfully",
      vendorProfile: serializeVendorProfile(profile),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update shipping settings", 400);
  }
}

export async function updateVendorNotificationsController(request, vendorId) {
  try {
    const body = await request.json();
    const profile = await updateVendorNotifications(vendorId, body);
    return Response.json({
      message: "Notification settings updated successfully",
      vendorProfile: serializeVendorProfile(profile),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update notifications", 400);
  }
}

export async function createWithdrawRequestController(request, vendorId) {
  try {
    const body = await request.json();
    const withdrawRequest = await createWithdrawRequest(vendorId, body);
    return Response.json(
      {
        message: "Withdraw request submitted successfully",
        withdrawRequest: serializeWithdrawRequest(withdrawRequest),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error.message || "Failed to create withdraw request", 400);
  }
}

export async function replyToReviewController(request, vendorId, reviewId) {
  try {
    const body = await request.json();
    const review = await replyToReview(vendorId, reviewId, body);
    return Response.json({
      message: "Review reply added successfully",
      review: serializeReview(review),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to reply to review", 400);
  }
}
