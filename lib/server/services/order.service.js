import prisma from "@/lib/prisma";
import {
  sendLowStockAlertEmail,
  sendOrderStatusEmail,
  sendVendorNewOrderEmail,
  sendVendorPaymentStatusEmail,
} from "@/lib/server/email";
import {
  ADMIN_ORDER_TO_VENDOR_STATUS,
  buildProductSnapshot,
  deriveOrderStatusFromItems,
  filterVendorItems,
  normalizeOrderItem,
  normalizeOrderItems,
  summarizeVendorOrders,
  toNumber,
} from "@/lib/server/vendor";
import { uploadSingleImage } from "@/lib/server/uploads";
import { getDefaultVendorCommission } from "@/lib/server/services/settings.service";

export const VALID_PAYMENT_METHODS = [
  "COD",
  "PhonePe",
  "Google Pay",
  "Paytm",
  "eSewa",
  "Fonepay",
];

export const VALID_PAYMENT_STATUSES = [
  "Pending",
  "Verification Pending",
  "Verified",
  "Rejected",
];

export const VALID_ADMIN_ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
];

export const VALID_VENDOR_PROGRESS_STATUSES = [
  "processing",
  "shipped",
  "delivered",
];

function buildAddressSnapshot(address = {}, user) {
  return {
    fullName: String(address.fullName || "").trim(),
    phoneNumber: String(address.phoneNumber || "").trim(),
    pincode: String(address.pincode || "").trim(),
    area: String(address.area || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    email: user?.email || "",
    paymentScreenshotUrl: String(address.paymentScreenshotUrl || "").trim(),
    paymentScreenshotPublicId: String(address.paymentScreenshotPublicId || "").trim(),
  };
}

function groupItemsByVendor(items = []) {
  return items.reduce((groups, item) => {
    if (!item.vendorId) {
      return groups;
    }

    if (!groups[item.vendorId]) {
      groups[item.vendorId] = [];
    }

    groups[item.vendorId].push(item);
    return groups;
  }, {});
}

async function buildOrderItems(itemsPayload = []) {
  const requestedItems = Array.isArray(itemsPayload) ? itemsPayload : [];

  if (requestedItems.length === 0) {
    throw new Error("At least one order item is required.");
  }

  const productIds = requestedItems
    .map((item) => item?.product?._id || item?.product?.id || item?.productId)
    .filter(Boolean);

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  return requestedItems.map((item) => {
    const productId = item?.product?._id || item?.product?.id || item?.productId;
    const product = productMap.get(productId);

    if (!product) {
      throw new Error("One or more ordered products were not found.");
    }

    if (product.vendorId && !product.isApproved) {
      throw new Error(`Product "${product.name}" is not approved for sale yet.`);
    }

    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));

    if (toNumber(product.stock, 0) < quantity) {
      throw new Error(`"${product.name}" does not have enough stock.`);
    }

    return normalizeOrderItem({
      id: product.id,
      quantity,
      vendorId: product.vendorId || product.userId,
      vendorStatus: "pending",
      vendorDecision: "pending",
      product: buildProductSnapshot(product),
    });
  });
}

async function createPaymentHistoryEntries(tx, order, groupedItems) {
  const defaultCommission = await getDefaultVendorCommission();
  const vendorIds = Object.keys(groupedItems);
  const vendorProfiles = await tx.vendorProfile.findMany({
    where: {
      userId: {
        in: vendorIds,
      },
    },
  });
  const profileMap = new Map(vendorProfiles.map((profile) => [profile.userId, profile]));

  for (const vendorId of vendorIds) {
    const items = groupedItems[vendorId];
    const grossAmount = items.reduce((total, item) => total + item.subtotal, 0);
    const commissionRate =
      profileMap.get(vendorId)?.commissionRate ?? defaultCommission;
    const commissionAmount = Number(
      ((grossAmount * Number(commissionRate)) / 100).toFixed(2)
    );

    await tx.paymentHistory.create({
      data: {
        vendorId,
        orderId: order.id,
        grossAmount,
        commissionAmount,
        netAmount: Number((grossAmount - commissionAmount).toFixed(2)),
        note: `Order #${order.id.slice(-8).toUpperCase()}`,
        status: "Pending",
      },
    });
  }
}

async function sendVendorAlertsForOrder(order, groupedItems) {
  const vendorIds = Object.keys(groupedItems);

  if (vendorIds.length === 0) {
    return;
  }

  const vendors = await prisma.user.findMany({
    where: {
      id: {
        in: vendorIds,
      },
    },
    include: {
      vendorProfile: true,
    },
  });

  for (const vendor of vendors) {
    const vendorItems = groupedItems[vendor.id] || [];

    if (vendor.vendorProfile?.notifyNewOrder && vendor.email) {
      try {
        await sendVendorNewOrderEmail({
          email: vendor.email,
          userName: vendor.name,
          order,
          items: vendorItems,
          storeName: vendor.vendorProfile?.storeName,
        });
      } catch (error) {
        console.error("Vendor new order email failed:", error);
      }
    }

    if (!vendor.vendorProfile?.notifyStock) {
      continue;
    }

    for (const item of vendorItems) {
      const stock = Number(item.product?.stock ?? 0) - Number(item.quantity ?? 0);

      if (stock > 5) {
        continue;
      }

      try {
        await sendLowStockAlertEmail({
          email: vendor.email,
          userName: vendor.name,
          product: {
            ...item.product,
            stock,
          },
          storeName: vendor.vendorProfile?.storeName,
        });
      } catch (error) {
        console.error("Vendor low stock email failed:", error);
      }
    }
  }
}

async function syncPaymentHistoryStatus(orderId, items) {
  const grouped = groupItemsByVendor(normalizeOrderItems(items));

  for (const [vendorId, vendorItems] of Object.entries(grouped)) {
    let status = "Pending";

    if (vendorItems.every((item) => item.vendorStatus === "rejected")) {
      status = "Cancelled";
    } else if (vendorItems.every((item) => item.vendorStatus === "delivered")) {
      status = "Ready";
    } else if (
      vendorItems.some((item) =>
        ["processing", "shipped", "delivered"].includes(item.vendorStatus)
      )
    ) {
      status = "Processing";
    }

    await prisma.paymentHistory.updateMany({
      where: {
        orderId,
        vendorId,
      },
      data: { status },
    });
  }
}

export async function createOrder({
  userId,
  items,
  amount,
  address,
  paymentMethod,
  paymentStatus,
  paymentScreenshot,
}) {
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const orderItems = await buildOrderItems(items);
  const uploadedScreenshotUrl = paymentScreenshot
    ? await uploadSingleImage(paymentScreenshot, {
        folder: "qcart/order-payment-screenshots",
      })
    : "";
  const orderAmount = Math.max(
    toNumber(amount),
    orderItems.reduce((total, item) => total + item.subtotal, 0)
  );
  const addressSnapshot = buildAddressSnapshot(
    {
      ...address,
      paymentScreenshotUrl: uploadedScreenshotUrl,
    },
    user
  );

  const createdOrder = await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        items: orderItems,
        amount: orderAmount,
        address: addressSnapshot,
        status: deriveOrderStatusFromItems(orderItems),
        paymentMethod,
        paymentStatus,
      },
      include: {
        user: true,
      },
    });

    await createPaymentHistoryEntries(tx, order, groupItemsByVendor(orderItems));

    return order;
  });

  await sendVendorAlertsForOrder(createdOrder, groupItemsByVendor(orderItems));

  return createdOrder;
}

export async function listAllOrders() {
  return prisma.order.findMany({
    include: {
      user: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listUserOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      user: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listVendorOrders(vendorId) {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.filter((order) => filterVendorItems(order.items, vendorId).length > 0);
}

export async function updateOrderPaymentStatus(orderId, paymentStatus) {
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
    include: {
      user: true,
    },
  });

  if (paymentStatus === "Verified") {
    await prisma.paymentHistory.updateMany({
      where: {
        orderId,
      },
      data: {
        status: "Confirmed",
      },
    });

    const vendorIds = Array.from(
      new Set(normalizeOrderItems(updatedOrder.items).map((item) => item.vendorId).filter(Boolean))
    );
    const vendors = await prisma.user.findMany({
      where: {
        id: {
          in: vendorIds,
        },
      },
      include: {
        vendorProfile: true,
      },
    });

    for (const vendor of vendors) {
      if (!vendor.vendorProfile?.notifyPayment || !vendor.email) {
        continue;
      }

      try {
        await sendVendorPaymentStatusEmail({
          email: vendor.email,
          userName: vendor.name,
          order: updatedOrder,
          paymentStatus,
          items: filterVendorItems(updatedOrder.items, vendor.id),
          storeName: vendor.vendorProfile?.storeName,
        });
      } catch (error) {
        console.error("Vendor payment email failed:", error);
      }
    }
  }

  return updatedOrder;
}

export async function deleteOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  await prisma.paymentHistory.deleteMany({
    where: { orderId },
  });

  return prisma.order.delete({
    where: { id: orderId },
  });
}

export async function updateAdminOrderStatus(orderId, status) {
  if (!VALID_ADMIN_ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const vendorStatus = ADMIN_ORDER_TO_VENDOR_STATUS[status];
  const items = normalizeOrderItems(order.items).map((item) => ({
    ...item,
    vendorStatus,
    vendorDecision: vendorStatus === "rejected" ? "rejected" : "accepted",
  }));

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      items,
    },
    include: {
      user: true,
    },
  });

  await syncPaymentHistoryStatus(orderId, items);

  if (order.user?.email) {
    try {
      await sendOrderStatusEmail({
        email: order.user.email,
        userName: order.user.name,
        previousStatus: order.status || "Pending",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Order status email send failed:", error);
    }
  }

  return updatedOrder;
}

export async function updateVendorOrder(orderId, vendorId, payload = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const itemId = String(payload.itemId || "").trim();

  if (!itemId) {
    throw new Error("Order item is required.");
  }

  const nextItems = normalizeOrderItems(order.items).map((item) => {
    if (item.id !== itemId || item.vendorId !== vendorId) {
      return item;
    }

    let vendorDecision = item.vendorDecision;
    let vendorStatus = item.vendorStatus;

    if (payload.action === "accept") {
      vendorDecision = "accepted";
      vendorStatus = vendorStatus === "pending" ? "processing" : vendorStatus;
    }

    if (payload.action === "reject") {
      vendorDecision = "rejected";
      vendorStatus = "rejected";
    }

    if (payload.status) {
      const normalizedStatus = String(payload.status || "").trim().toLowerCase();

      if (!VALID_VENDOR_PROGRESS_STATUSES.includes(normalizedStatus)) {
        throw new Error("Invalid vendor order status.");
      }

      vendorDecision = "accepted";
      vendorStatus = normalizedStatus;
    }

    return {
      ...item,
      vendorDecision,
      vendorStatus,
      acceptedAt:
        vendorDecision === "accepted" && !item.acceptedAt
          ? new Date().toISOString()
          : item.acceptedAt,
      rejectedAt:
        vendorDecision === "rejected" && !item.rejectedAt
          ? new Date().toISOString()
          : item.rejectedAt,
      shippedAt:
        vendorStatus === "shipped" && !item.shippedAt
          ? new Date().toISOString()
          : item.shippedAt,
      deliveredAt:
        vendorStatus === "delivered" && !item.deliveredAt
          ? new Date().toISOString()
          : item.deliveredAt,
    };
  });

  if (!nextItems.some((item) => item.id === itemId && item.vendorId === vendorId)) {
    throw new Error("Vendor order item not found.");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      items: nextItems,
      status: deriveOrderStatusFromItems(nextItems),
    },
    include: {
      user: true,
    },
  });

  await syncPaymentHistoryStatus(orderId, nextItems);

  if (order.user?.email) {
    try {
      await sendOrderStatusEmail({
        email: order.user.email,
        userName: order.user.name,
        previousStatus: order.status || "Pending",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Vendor order status email send failed:", error);
    }
  }

  return updatedOrder;
}

export async function generateVendorInvoice(orderId, vendorId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      vendorProfile: true,
    },
  });

  if (!order || !vendor?.vendorProfile) {
    throw new Error("Unable to generate invoice.");
  }

  const vendorItems = filterVendorItems(order.items, vendorId);

  if (vendorItems.length === 0) {
    throw new Error("No vendor items found for this invoice.");
  }

  const totals = summarizeVendorOrders(
    [{ ...order, items: vendorItems }],
    vendorId,
    vendor.vendorProfile.commissionRate
  );

  return {
    invoiceNumber: `INV-${order.id.slice(-6).toUpperCase()}-${vendorId.slice(-4).toUpperCase()}`,
    orderId: order.id,
    issuedAt: new Date().toISOString(),
    store: {
      storeName: vendor.vendorProfile.storeName,
      logo: vendor.vendorProfile.logo,
      address: [
        vendor.vendorProfile.address1,
        vendor.vendorProfile.address2,
        vendor.vendorProfile.city,
        vendor.vendorProfile.state,
        vendor.vendorProfile.pincode,
        vendor.vendorProfile.country,
      ]
        .filter(Boolean)
        .join(", "),
      email: vendor.email,
      phoneNumber: vendor.phoneNumber,
    },
    customer: {
      name: order.user?.name || order.address?.fullName || "",
      email: order.user?.email || order.address?.email || "",
      phoneNumber: order.user?.phoneNumber || order.address?.phoneNumber || "",
      address: [
        order.address?.area,
        order.address?.city,
        order.address?.state,
        order.address?.pincode,
      ]
        .filter(Boolean)
        .join(", "),
    },
    items: vendorItems,
    totals,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  };
}
