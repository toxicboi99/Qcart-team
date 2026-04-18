import prisma from "@/lib/prisma";
import { sendVendorPayoutStatusEmail } from "@/lib/server/email";
import { toNumber } from "@/lib/server/vendor";
import { setDefaultVendorCommission } from "@/lib/server/services/settings.service";

const ADMIN_WITHDRAW_REQUEST_STATUSES = ["Pending", "Approved", "Done", "Rejected"];

async function countVendorOrders(vendorId) {
  const orders = await prisma.order.findMany({
    select: {
      items: true,
    },
  });

  return orders.filter((order) =>
    Array.isArray(order.items)
      ? order.items.some((item) => (item.vendorId || item.product?.vendorId) === vendorId)
      : false
  ).length;
}

export async function listVendorsForAdmin() {
  const vendors = await prisma.user.findMany({
    where: {
      isVendor: true,
    },
    include: {
      vendorProfile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const vendorRows = await Promise.all(
    vendors.map(async (vendor) => {
      const [productCount, orderCount] = await Promise.all([
        prisma.product.count({
          where: {
            vendorId: vendor.id,
          },
        }),
        countVendorOrders(vendor.id),
      ]);

      return {
        ...vendor,
        productCount,
        orderCount,
      };
    })
  );

  return vendorRows;
}

export async function approveVendor(vendorId) {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: { vendorProfile: true },
  });

  if (!vendor || !vendor.isVendor) {
    throw new Error("Vendor not found.");
  }

  return prisma.user.update({
    where: { id: vendorId },
    data: {
      isApproved: true,
      isBlocked: false,
      role: "vendor",
    },
    include: {
      vendorProfile: true,
    },
  });
}

export async function blockVendor(vendorId, payload = {}) {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
  });

  if (!vendor || !vendor.isVendor) {
    throw new Error("Vendor not found.");
  }

  const isBlocked = payload.isBlocked === undefined ? true : Boolean(payload.isBlocked);

  return prisma.user.update({
    where: { id: vendorId },
    data: {
      isBlocked,
    },
    include: {
      vendorProfile: true,
    },
  });
}

export async function updateVendorCommission(vendorId, rate) {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: { vendorProfile: true },
  });

  if (!vendor?.vendorProfile) {
    throw new Error("Vendor profile not found.");
  }

  return prisma.vendorProfile.update({
    where: { userId: vendorId },
    data: {
      commissionRate: Math.max(0, Math.min(100, toNumber(rate))),
    },
  });
}

export async function updateDefaultCommission(rate) {
  return setDefaultVendorCommission(rate);
}

export async function updateProductApproval(productId, payload = {}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      isApproved: Boolean(payload.isApproved),
      approvalNotes:
        payload.approvalNotes === undefined
          ? product.approvalNotes
          : String(payload.approvalNotes || "").trim() || null,
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

export async function listWithdrawRequestsForAdmin() {
  return prisma.withdrawRequest.findMany({
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateWithdrawRequestStatus(requestId, nextStatus, payload = {}) {
  const status = String(nextStatus || "").trim();

  if (!ADMIN_WITHDRAW_REQUEST_STATUSES.includes(status)) {
    throw new Error("Invalid withdraw request status.");
  }

  const withdrawRequest = await prisma.withdrawRequest.findUnique({
    where: { id: requestId },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });

  if (!withdrawRequest) {
    throw new Error("Withdraw request not found.");
  }

  if (status === "Approved" && withdrawRequest.status !== "Pending") {
    throw new Error("Only pending requests can be approved.");
  }

  if (status === "Done" && withdrawRequest.status !== "Approved") {
    throw new Error("Only approved requests can be marked as done.");
  }

  if (status === "Rejected" && withdrawRequest.status === "Done") {
    throw new Error("Completed payout requests cannot be rejected.");
  }

  const note = String(payload.note || withdrawRequest.note || "").trim() || null;
  const updatedRequest = await prisma.withdrawRequest.update({
    where: { id: requestId },
    data: {
      status,
      note,
    },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });

  if (updatedRequest.vendor?.email && ["Approved", "Done", "Rejected"].includes(status)) {
    try {
      await sendVendorPayoutStatusEmail({
        email: updatedRequest.vendor.email,
        userName: updatedRequest.vendor.name,
        amount: updatedRequest.amount,
        status,
        requestId: updatedRequest.id,
        storeName: updatedRequest.vendor.vendorProfile?.storeName,
        note,
      });
    } catch (error) {
      console.error("Vendor payout email failed:", error);
    }
  }

  return updatedRequest;
}
