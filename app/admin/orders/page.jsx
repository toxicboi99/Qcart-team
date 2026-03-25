'use client';
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/admin/Footer";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function formatDate(value) {
  if (!value) return "Recently";
  return new Date(value).toLocaleString();
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Processing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

const Orders = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  const fetchAdminOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setIsBackendAvailable(true);
      } else {
        console.warn("API returned error, using dummy data");
        setIsBackendAvailable(false);
        const { orderDummyData } = await import("@/assets/assets");
        setOrders(orderDummyData || []);
      }
    } catch (error) {
      console.warn("Backend server not available, using dummy data:", error.message);
      setIsBackendAvailable(false);

      try {
        const { orderDummyData } = await import("@/assets/assets");
        setOrders(orderDummyData || []);
      } catch (importError) {
        console.error("Failed to load dummy data:", importError);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (response.ok) {
        toast.success(`Payment marked as ${newPaymentStatus}`);
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId
              ? { ...order, paymentStatus: newPaymentStatus }
              : order
          )
        );
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }

    const confirmed = window.confirm(
      "Delete this order permanently? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Order deleted successfully");
        setOrders((currentOrders) =>
          currentOrders.filter((order) => order._id !== orderId)
        );
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-5 p-4 md:p-8">
          {!isBackendAvailable && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Orders API is not available right now, so
                you are seeing demo data.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
                Admin Orders
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                All customer orders
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Total Orders
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {orders.length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                No orders found
              </div>
            ) : (
              orders.map((order, index) => (
                <div
                  key={order._id || index}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Order ID
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        #{order._id?.slice(-8)?.toUpperCase() || index + 1}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Placed on {formatDate(order.createdAt || order.date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Amount
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {currency}
                          {order.amount}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${getStatusTone(order.status || "Pending")}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.9fr_0.95fr_0.95fr]">
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Order Items
                      </p>
                      <div className="mt-4 space-y-3">
                        {(order.items || []).map((item, itemIndex) => (
                          <div
                            key={`${order._id || index}-item-${itemIndex}`}
                            className="flex items-center gap-3 rounded-2xl bg-white p-3"
                          >
                            <img
                              src={item.product?.image?.[0] || "/payment-qr.svg"}
                              alt={item.product?.name || "Product"}
                              className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">
                                {item.product?.name || "Product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.product?.category || "General"}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-slate-900">
                                {currency}
                                {item.product?.offerPrice ?? item.product?.price ?? 0}
                              </p>
                              <p className="mt-1 text-slate-500">x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Customer Details
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Full Name
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {order.customer?.name || order.address?.fullName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Email
                          </p>
                          <p className="mt-1 break-all">
                            {order.customer?.email || order.address?.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Phone
                          </p>
                          <p className="mt-1">
                            {order.customer?.phoneNumber ||
                              order.address?.phoneNumber ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            User ID
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {order.userId}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Delivery Address
                      </p>
                      <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                        <p className="font-semibold text-slate-900">
                          {order.address?.fullName || "N/A"}
                        </p>
                        <p>{order.address?.area || "N/A"}</p>
                        <p>
                          {[order.address?.city, order.address?.state]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </p>
                        <p>{order.address?.pincode || "N/A"}</p>
                        <p>{order.address?.phoneNumber || "N/A"}</p>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Payment Proof
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Method
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {order.paymentMethod || "COD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Payment Status
                          </p>
                          <p className="mt-1">{order.paymentStatus || "Pending"}</p>
                        </div>

                        {order.paymentScreenshotUrl ? (
                          <a
                            href={order.paymentScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-slate-200 bg-white"
                          >
                            <img
                              src={order.paymentScreenshotUrl}
                              alt="Payment screenshot"
                              className="h-40 w-full object-cover"
                            />
                            <div className="border-t border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                              Open full screenshot
                            </div>
                          </a>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-xs uppercase tracking-[0.16em] text-slate-400">
                            No screenshot uploaded
                          </div>
                        )}

                        <div className="grid gap-2 pt-2">
                          {order.paymentMethod !== "COD" &&
                            order.paymentStatus !== "Verified" && (
                              <button
                                onClick={() =>
                                  updatePaymentStatus(order._id, "Verified")
                                }
                                className="rounded-2xl bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200"
                              >
                                Verify Payment
                              </button>
                            )}
                          <button
                            onClick={() => deleteOrder(order._id)}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Delete Order
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Orders;
