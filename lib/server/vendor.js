export const DEFAULT_VENDOR_COMMISSION = 10;

export const APP_SETTING_KEYS = {
  defaultVendorCommission: "vendor.defaultCommission",
};

export const VENDOR_CATEGORIES = [
  "electronics",
  "fashion",
  "grocery",
  "beauty",
  "home",
  "sports",
  "books",
  "toys",
  "health",
  "automotive",
  "accessories",
];

export const VENDOR_BUSINESS_TYPES = ["individual", "company"];

export const VENDOR_ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "rejected",
];

export const VENDOR_DECISIONS = ["pending", "accepted", "rejected"];

export const ADMIN_ORDER_TO_VENDOR_STATUS = {
  Pending: "pending",
  Processing: "processing",
  Completed: "delivered",
  Cancelled: "rejected",
};

export function isVendorRole(role = "") {
  return ["vendor", "seller", "admin"].includes(String(role).toLowerCase());
}

export function isAdminRole(role = "") {
  return String(role).toLowerCase() === "admin";
}

export function normalizeBusinessType(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return VENDOR_BUSINESS_TYPES.includes(normalized) ? normalized : "individual";
}

export function normalizeVendorOrderStatus(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return VENDOR_ORDER_STATUSES.includes(normalized) ? normalized : "pending";
}

export function normalizeVendorDecision(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return VENDOR_DECISIONS.includes(normalized) ? normalized : "pending";
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

export function buildProductSnapshot(product = {}) {
  return {
    _id: product._id || product.id || "",
    id: product.id || product._id || "",
    name: product.name || "",
    description: product.description || "",
    category: product.category || "",
    price: toNumber(product.price),
    offerPrice: toNumber(product.offerPrice, toNumber(product.price)),
    discount: toNumber(product.discount),
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    image: Array.isArray(product.image) ? product.image.filter(Boolean) : [],
    variants: Array.isArray(product.variants)
      ? product.variants
      : parseJson(product.variants, []),
    vendorId: product.vendorId || product.userId || "",
    userId: product.userId || "",
    isApproved: Boolean(product.isApproved),
  };
}

export function normalizeOrderItem(item = {}) {
  const product = buildProductSnapshot(item.product || item);
  const quantity = Math.max(0, Math.floor(toNumber(item.quantity, 0)));
  const vendorStatus = normalizeVendorOrderStatus(
    item.vendorStatus || item.status || "pending"
  );
  const vendorDecision = normalizeVendorDecision(
    item.vendorDecision ||
      (vendorStatus === "rejected"
        ? "rejected"
        : vendorStatus === "pending"
          ? "pending"
          : "accepted")
  );
  const unitPrice = toNumber(
    product.offerPrice || item.offerPrice,
    toNumber(product.price || item.price)
  );

  return {
    id:
      item.id ||
      item.itemId ||
      product._id ||
      [product.vendorId, product.name].filter(Boolean).join("-"),
    product,
    quantity,
    vendorId: item.vendorId || product.vendorId || "",
    vendorStatus,
    vendorDecision,
    acceptedAt: item.acceptedAt || null,
    rejectedAt: item.rejectedAt || null,
    shippedAt: item.shippedAt || null,
    deliveredAt: item.deliveredAt || null,
    subtotal: Number((unitPrice * quantity).toFixed(2)),
  };
}

export function normalizeOrderItems(items = []) {
  return Array.isArray(items) ? items.map(normalizeOrderItem) : [];
}

export function deriveOrderStatusFromItems(items = []) {
  const normalizedItems = normalizeOrderItems(items);

  if (normalizedItems.length === 0) {
    return "Pending";
  }

  const statuses = normalizedItems.map((item) => item.vendorStatus);

  if (statuses.every((status) => status === "delivered")) {
    return "Completed";
  }

  if (statuses.every((status) => status === "rejected")) {
    return "Cancelled";
  }

  if (
    statuses.some((status) => ["processing", "shipped", "delivered"].includes(status))
  ) {
    return "Processing";
  }

  return "Pending";
}

export function filterVendorItems(items = [], vendorId = "") {
  return normalizeOrderItems(items).filter(
    (item) => item.vendorId && item.vendorId === vendorId
  );
}

export function summarizeVendorOrders(
  orders = [],
  vendorId = "",
  commissionRate = DEFAULT_VENDOR_COMMISSION
) {
  const summary = {
    totalSales: 0,
    totalOrders: 0,
    earnings: 0,
    commissionDeduction: 0,
    pendingOrders: 0,
  };

  for (const order of orders) {
    const vendorItems = filterVendorItems(order.items, vendorId);

    if (vendorItems.length === 0) {
      continue;
    }

    summary.totalOrders += 1;

    if (vendorItems.some((item) => item.vendorStatus === "pending")) {
      summary.pendingOrders += 1;
    }

    const gross = vendorItems.reduce((total, item) => total + item.subtotal, 0);
    const commission = Number(((gross * commissionRate) / 100).toFixed(2));

    summary.totalSales += gross;
    summary.commissionDeduction += commission;

    if (
      vendorItems.some((item) =>
        ["processing", "shipped", "delivered"].includes(item.vendorStatus)
      )
    ) {
      summary.earnings += gross - commission;
    }
  }

  return {
    totalSales: Number(summary.totalSales.toFixed(2)),
    totalOrders: summary.totalOrders,
    earnings: Number(summary.earnings.toFixed(2)),
    commissionDeduction: Number(summary.commissionDeduction.toFixed(2)),
    pendingOrders: summary.pendingOrders,
  };
}
