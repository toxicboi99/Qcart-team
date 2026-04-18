import {
  DEFAULT_VENDOR_COMMISSION,
  normalizeOrderItems,
  summarizeVendorOrders,
} from "@/lib/server/vendor";

export function serializeUser(user) {
  if (!user) return null;

  return {
    _id: user.id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    phone: user.phoneNumber,
    isVerified: user.isVerified,
    role: user.role || "user",
    isVendor: Boolean(user.isVendor),
    isApproved: Boolean(user.isApproved),
    isBlocked: Boolean(user.isBlocked),
    vendorProfile: serializeVendorProfile(user.vendorProfile),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeVendorProfile(profile) {
  if (!profile) return null;

  return {
    _id: profile.id,
    userId: profile.userId,
    storeName: profile.storeName,
    businessType: profile.businessType,
    description: profile.description,
    logo: profile.logo,
    banner: profile.banner || "",
    address: {
      address1: profile.address1,
      address2: profile.address2 || "",
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      country: profile.country,
    },
    payment: {
      accountHolderName: profile.accountHolderName || "",
      bankName: profile.bankName || "",
      accountNumber: profile.accountNumber || "",
      esewaId: profile.esewaId || "",
      fonepayId: profile.fonepayId || "",
    },
    verification: {
      panNumber: profile.panNumber,
      citizenshipNumber: profile.citizenshipNumber,
    },
    categories: Array.isArray(profile.categories) ? profile.categories : [],
    termsAccepted: Boolean(profile.termsAccepted),
    commissionAccepted: Boolean(profile.commissionAccepted),
    commissionRate: Number(profile.commissionRate ?? DEFAULT_VENDOR_COMMISSION),
    shipping: {
      deliveryCharge: Number(profile.deliveryCharge ?? 0),
      deliveryAreas: Array.isArray(profile.deliveryAreas)
        ? profile.deliveryAreas
        : [],
      pickupAddress: {
        address1: profile.pickupAddress1 || "",
        address2: profile.pickupAddress2 || "",
        city: profile.pickupCity || "",
        state: profile.pickupState || "",
        pincode: profile.pickupPincode || "",
        country: profile.pickupCountry || "",
      },
    },
    notifications: {
      newOrder: Boolean(profile.notifyNewOrder),
      payment: Boolean(profile.notifyPayment),
      stock: Boolean(profile.notifyStock),
    },
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function serializeProduct(product) {
  if (!product) return null;

  return {
    _id: product.id,
    userId: product.userId,
    vendorId: product.vendorId || product.userId,
    vendor: serializeUser(product.vendor),
    name: product.name,
    description: product.description,
    price: product.price,
    offerPrice: product.offerPrice,
    discount: Number(product.discount ?? 0),
    stock: Number(product.stock ?? 0),
    variants: Array.isArray(product.variants)
      ? product.variants
      : product.variants || [],
    image: Array.isArray(product.image) ? product.image : [],
    category: product.category,
    isApproved: Boolean(product.isApproved),
    approvalNotes: product.approvalNotes || "",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeOrder(order) {
  if (!order) return null;

  const address = order.address || {};
  const user = serializeUser(order.user);
  const items = normalizeOrderItems(order.items);

  return {
    _id: order.id,
    userId: order.userId,
    user,
    customer: {
      name: user?.name || address.fullName || "",
      email: user?.email || address.email || "",
      phoneNumber: user?.phoneNumber || address.phoneNumber || "",
    },
    items,
    amount: Number(order.amount),
    address,
    status: order.status || "Pending",
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "Pending",
    paymentScreenshotUrl: address.paymentScreenshotUrl || "",
    paymentScreenshotPublicId: address.paymentScreenshotPublicId || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function serializePaymentHistory(entry) {
  if (!entry) return null;

  return {
    _id: entry.id,
    vendorId: entry.vendorId,
    orderId: entry.orderId || "",
    productId: entry.productId || "",
    grossAmount: Number(entry.grossAmount ?? 0),
    commissionAmount: Number(entry.commissionAmount ?? 0),
    netAmount: Number(entry.netAmount ?? 0),
    note: entry.note || "",
    status: entry.status || "Pending",
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function serializeWithdrawRequest(request) {
  if (!request) return null;

  return {
    _id: request.id,
    vendorId: request.vendorId,
    vendor: serializeUser(request.vendor),
    amount: Number(request.amount ?? 0),
    note: request.note || "",
    status: request.status || "Pending",
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export function serializeReview(review) {
  if (!review) return null;

  return {
    _id: review.id,
    productId: review.productId,
    vendorId: review.vendorId,
    userId: review.userId || "",
    rating: Number(review.rating ?? 0),
    comment: review.comment || "",
    reply: review.reply || "",
    author: serializeUser(review.author),
    product: serializeProduct(review.product),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export function serializeVendorDashboard({
  vendor,
  profile,
  orders = [],
  paymentHistory = [],
  withdrawRequests = [],
  products = [],
  reviews = [],
  payoutStats = null,
}) {
  const metrics = summarizeVendorOrders(
    orders,
    vendor?.id || vendor?._id || "",
    Number(profile?.commissionRate ?? DEFAULT_VENDOR_COMMISSION)
  );

  return {
    vendor: serializeUser(vendor),
    store: serializeVendorProfile(profile),
    metrics,
    products: products.map(serializeProduct),
    orders: orders.map(serializeOrder),
    paymentHistory: paymentHistory.map(serializePaymentHistory),
    withdrawRequests: withdrawRequests.map(serializeWithdrawRequest),
    reviews: reviews.map(serializeReview),
    payoutStats: payoutStats
      ? {
          totalEligible: Number(payoutStats.totalEligible ?? 0),
          totalReserved: Number(payoutStats.totalReserved ?? 0),
          availableBalance: Number(payoutStats.availableBalance ?? 0),
          latestRequestAt: payoutStats.latestRequestAt || null,
        }
      : null,
  };
}

export function serializeContact(contact) {
  if (!contact) return null;

  return {
    _id: contact.id,
    type: contact.type,
    name: contact.name,
    email: contact.email,
    phoneNumber: contact.phoneNumber || "",
    message: contact.message || "",
    status: contact.status || "new",
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}
