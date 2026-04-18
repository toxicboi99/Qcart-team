import { errorResponse } from "@/lib/server/http";
import {
  serializeProduct,
  serializeUser,
  serializeVendorProfile,
  serializeWithdrawRequest,
} from "@/lib/server/serializers";
import {
  approveVendor,
  blockVendor,
  listWithdrawRequestsForAdmin,
  listVendorsForAdmin,
  updateDefaultCommission,
  updateProductApproval,
  updateWithdrawRequestStatus,
  updateVendorCommission,
} from "@/lib/server/services/admin.service";
import { getDefaultVendorCommission } from "@/lib/server/services/settings.service";

function serializeAdminVendor(vendor) {
  return {
    ...serializeUser(vendor),
    vendorProfile: serializeVendorProfile(vendor.vendorProfile),
    productCount: Number(vendor.productCount ?? 0),
    orderCount: Number(vendor.orderCount ?? 0),
  };
}

export async function listVendorsController() {
  try {
    const vendors = await listVendorsForAdmin();
    return Response.json(vendors.map(serializeAdminVendor));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch vendors", 400);
  }
}

export async function approveVendorController(vendorId) {
  try {
    const vendor = await approveVendor(vendorId);
    return Response.json({
      message: "Vendor approved successfully",
      vendor: serializeAdminVendor(vendor),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to approve vendor", 400);
  }
}

export async function blockVendorController(request, vendorId) {
  try {
    const body = await request.json();
    const vendor = await blockVendor(vendorId, body);
    return Response.json({
      message: body.isBlocked === false ? "Vendor unblocked successfully" : "Vendor blocked successfully",
      vendor: serializeAdminVendor(vendor),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update vendor block status", 400);
  }
}

export async function updateVendorCommissionController(request, vendorId) {
  try {
    const body = await request.json();
    const profile = await updateVendorCommission(vendorId, body.commissionRate);
    return Response.json({
      message: "Vendor commission updated successfully",
      vendorProfile: serializeVendorProfile(profile),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update vendor commission", 400);
  }
}

export async function updateDefaultCommissionController(request) {
  try {
    const body = await request.json();
    const setting = await updateDefaultCommission(body.commissionRate);
    return Response.json({
      message: "Default commission updated successfully",
      setting,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update default commission", 400);
  }
}

export async function getDefaultCommissionController() {
  try {
    const commissionRate = await getDefaultVendorCommission();
    return Response.json({ commissionRate });
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch default commission", 400);
  }
}

export async function updateProductApprovalController(request, productId) {
  try {
    const body = await request.json();
    const product = await updateProductApproval(productId, body);
    return Response.json({
      message: "Product approval updated successfully",
      product: serializeProduct(product),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update product approval", 400);
  }
}

export async function listWithdrawRequestsController() {
  try {
    const requests = await listWithdrawRequestsForAdmin();
    return Response.json(requests.map(serializeWithdrawRequest));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch withdraw requests", 400);
  }
}

export async function updateWithdrawRequestStatusController(request, requestId) {
  try {
    const body = await request.json();
    const withdrawRequest = await updateWithdrawRequestStatus(
      requestId,
      body.status,
      body
    );

    return Response.json({
      message: `Withdraw request marked as ${withdrawRequest.status}`,
      withdrawRequest: serializeWithdrawRequest(withdrawRequest),
    });
  } catch (error) {
    return errorResponse(
      error.message || "Failed to update withdraw request",
      error.statusCode || 400
    );
  }
}
