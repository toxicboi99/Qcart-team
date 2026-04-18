'use client';

import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

function getStatusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "shipped":
      return "bg-sky-100 text-sky-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function renderInvoiceHtml(invoice) {
  return `
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${invoice.invoiceNumber}</h1>
        <p>Issued ${new Date(invoice.issuedAt).toLocaleString()}</p>
        <div class="grid">
          <div class="card">
            <h3>Store</h3>
            <p><strong>${invoice.store.storeName}</strong></p>
            <p>${invoice.store.address}</p>
            <p>${invoice.store.email}</p>
            <p>${invoice.store.phoneNumber}</p>
          </div>
          <div class="card">
            <h3>Customer</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            <p>${invoice.customer.address}</p>
            <p>${invoice.customer.email}</p>
            <p>${invoice.customer.phoneNumber}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.subtotal}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
        <div class="grid" style="margin-top: 24px;">
          <div class="card">
            <h3>Payment</h3>
            <p>Method: ${invoice.paymentMethod}</p>
            <p>Status: ${invoice.paymentStatus}</p>
          </div>
          <div class="card">
            <h3>Totals</h3>
            <p>Total Sales: $${invoice.totals.totalSales}</p>
            <p>Commission: $${invoice.totals.commissionDeduction}</p>
            <p><strong>Net Earnings: $${invoice.totals.earnings}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default function VendorOrdersPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();

  const updateOrder = async (orderId, itemId, payload) => {
    try {
      const { response, data } = await fetchWithSession(`/api/vendors/orders/${orderId}`, {
        sessionSource: "user",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update vendor order.");
      }

      toast.success(data.message || "Order updated successfully.");
      refresh({ silent: true });
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update vendor order.");
    }
  };

  const printInvoice = async (orderId) => {
    try {
      const { response, data } = await fetchWithSession(
        `/api/vendors/orders/${orderId}/invoice`,
        {
          sessionSource: "user",
        }
      );

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate invoice.");
      }

      const printWindow = window.open("", "_blank", "width=980,height=720");

      if (!printWindow) {
        throw new Error("Unable to open invoice window.");
      }

      printWindow.document.write(renderInvoiceHtml(data.invoice));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (invoiceError) {
      toast.error(invoiceError.message || "Failed to generate invoice.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error || "Unable to load vendor orders."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        {(dashboard.orders || []).map((order) => (
          <div
            key={order._id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Vendor Order
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  #{order._id.slice(-8).toUpperCase()}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {order.customer?.name || "Customer"} • {order.customer?.email || "No email"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    $
                    {order.items
                      .reduce((total, item) => total + Number(item.subtotal || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payment</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {order.paymentMethod} • {order.paymentStatus}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => printInvoice(order._id)}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Generate invoice
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div
                  key={`${order._id}-${item.id}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      <img
                        src={item.product?.image?.[0] || "/payment-qr.svg"}
                        alt={item.product?.name || "Product"}
                        className="h-20 w-20 rounded-3xl border border-slate-200 object-cover"
                      />
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty {item.quantity} • ${item.subtotal}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Status:{" "}
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(
                              item.vendorStatus
                            )}`}
                          >
                            {item.vendorStatus}
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Decision: {item.vendorDecision}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:w-[320px]">
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, item.id, { action: "accept" })}
                        className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, item.id, { action: "reject" })}
                        className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, item.id, { status: "processing" })}
                        className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700"
                      >
                        Mark processing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, item.id, { status: "shipped" })}
                        className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700"
                      >
                        Mark shipped
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, item.id, { status: "delivered" })}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
                      >
                        Mark delivered
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {dashboard.orders?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
            No vendor orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
