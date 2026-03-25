export function serializeUser(user) {
  if (!user) return null;

  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    isVerified: user.isVerified,
    role: user.role || "user",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeProduct(product) {
  if (!product) return null;

  return {
    _id: product.id,
    userId: product.userId,
    name: product.name,
    description: product.description,
    price: product.price,
    offerPrice: product.offerPrice,
    image: Array.isArray(product.image) ? product.image : [],
    category: product.category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeOrder(order) {
  if (!order) return null;

  return {
    _id: order.id,
    userId: order.userId,
    items: Array.isArray(order.items) ? order.items : [],
    amount: Number(order.amount),
    address: order.address || {},
    status: order.status || "Pending",
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "Pending",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
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
