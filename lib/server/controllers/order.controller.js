import { errorResponse } from "@/lib/server/http";
import { parseRequestData } from "@/lib/server/request";
import { serializeOrder } from "@/lib/server/serializers";
import {
  createOrder,
  deleteOrder,
  generateVendorInvoice,
  listAllOrders,
  listUserOrders,
  listVendorOrders,
  updateAdminOrderStatus,
  updateOrderPaymentStatus,
  updateVendorOrder,
} from "@/lib/server/services/order.service";
import { filterVendorItems } from "@/lib/server/vendor";

function serializeVendorScopedOrder(order, vendorId) {
  return serializeOrder({
    ...order,
    items: filterVendorItems(order.items, vendorId),
  });
}

export async function createOrderController(request) {
  try {
    const { data, formData } = await parseRequestData(request);
    const order = await createOrder({
      userId: String(data.userId || "").trim(),
      items: Array.isArray(data.items) ? data.items : JSON.parse(String(data.items || "[]")),
      amount: data.amount,
      address:
        typeof data.address === "object"
          ? data.address
          : JSON.parse(String(data.address || "{}")),
      paymentMethod: String(data.paymentMethod || "COD").trim(),
      paymentStatus: String(data.paymentStatus || "Pending").trim(),
      paymentScreenshot: formData?.get("paymentScreenshot") || null,
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

export async function listAllOrdersController() {
  try {
    const orders = await listAllOrders();
    return Response.json(orders.map(serializeOrder));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch orders", 400);
  }
}

export async function listUserOrdersController(userId) {
  try {
    const orders = await listUserOrders(userId);
    return Response.json(orders.map(serializeOrder));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch user orders", 400);
  }
}

export async function listVendorOrdersController(vendorId) {
  try {
    const orders = await listVendorOrders(vendorId);
    return Response.json(orders.map((order) => serializeVendorScopedOrder(order, vendorId)));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch vendor orders", 400);
  }
}

export async function updateOrderPaymentStatusController(request, orderId) {
  try {
    const body = await request.json();
    const order = await updateOrderPaymentStatus(
      orderId,
      String(body.paymentStatus || "").trim()
    );

    return Response.json({
      message: "Payment status updated successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update payment status", 400);
  }
}

export async function deleteOrderController(orderId) {
  try {
    await deleteOrder(orderId);

    return Response.json({
      message: "Order deleted successfully",
      orderId,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to delete order", 400);
  }
}

export async function updateAdminOrderStatusController(request, orderId) {
  try {
    const body = await request.json();
    const order = await updateAdminOrderStatus(
      orderId,
      String(body.status || "").trim()
    );

    return Response.json({
      message: "Order status updated successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update order status", 400);
  }
}

export async function updateVendorOrderController(request, orderId, vendorId) {
  try {
    const body = await request.json();
    const order = await updateVendorOrder(orderId, vendorId, body);

    return Response.json({
      message: "Vendor order updated successfully",
      order: serializeVendorScopedOrder(order, vendorId),
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to update vendor order", 400);
  }
}

export async function generateVendorInvoiceController(orderId, vendorId) {
  try {
    const invoice = await generateVendorInvoice(orderId, vendorId);
    return Response.json({
      message: "Invoice generated successfully",
      invoice,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to generate invoice", 400);
  }
}
