'use client';

import Link from "next/link";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

function MetricCard({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getApprovalMessage(vendor) {
  if (vendor?.isBlocked) {
    return {
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      title: "Vendor account is blocked",
      body: "Admin access is required before you can continue receiving new vendor activity.",
    };
  }

  if (!vendor?.isApproved) {
    return {
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      title: "Approval pending",
      body: "Your vendor account has been created, but product publishing stays on hold until admin approval.",
    };
  }

  return null;
}

export default function VendorDashboardPage() {
  const { dashboard, loading, error } = useVendorDashboard();

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
          {error || "Unable to load vendor dashboard."}
        </div>
      </div>
    );
  }

  const approvalMessage = getApprovalMessage(dashboard.vendor);

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        {approvalMessage && (
          <div className={`rounded-3xl border p-5 ${approvalMessage.tone}`}>
            <h2 className="text-lg font-semibold">{approvalMessage.title}</h2>
            <p className="mt-2 text-sm leading-7">{approvalMessage.body}</p>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Sales"
            value={`$${dashboard.metrics?.totalSales ?? 0}`}
            tone="border-slate-200 bg-white"
          />
          <MetricCard
            label="Total Orders"
            value={dashboard.metrics?.totalOrders ?? 0}
            tone="border-slate-200 bg-white"
          />
          <MetricCard
            label="Earnings"
            value={`$${dashboard.metrics?.earnings ?? 0}`}
            tone="border-emerald-200 bg-emerald-50"
          />
          <MetricCard
            label="Pending Orders"
            value={dashboard.metrics?.pendingOrders ?? 0}
            tone="border-amber-200 bg-amber-50"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Recent Orders
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Latest vendor activity
                </h2>
              </div>
              <Link
                href="/vendor/dashboard/orders"
                className="text-sm font-semibold text-orange-600 hover:text-orange-500"
              >
                View all orders
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {(dashboard.orders || []).slice(0, 4).map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.customer?.name || "Customer"} • {order.items.length} items
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}

              {dashboard.orders?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No vendor orders yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Store Snapshot
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Quick view
                  </h2>
                </div>
                <Link
                  href="/vendor/dashboard/store"
                  className="text-sm font-semibold text-orange-600 hover:text-orange-500"
                >
                  Edit store
                </Link>
              </div>

              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Categories
                  </p>
                  <p className="mt-2 leading-7">
                    {(dashboard.store?.categories || []).join(", ") || "No categories set"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Delivery Areas
                  </p>
                  <p className="mt-2 leading-7">
                    {(dashboard.store?.shipping?.deliveryAreas || []).join(", ") ||
                      "No delivery areas configured"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Product Queue
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Approval pipeline
                  </h2>
                </div>
                <Link
                  href="/vendor/dashboard/products"
                  className="text-sm font-semibold text-orange-600 hover:text-orange-500"
                >
                  Manage products
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard.products || []).slice(0, 4).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        product.isApproved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {product.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                ))}

                {dashboard.products?.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    No vendor products yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
