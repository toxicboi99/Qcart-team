'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

export default function VendorNotificationsPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [form, setForm] = useState({
    notifyNewOrder: true,
    notifyPayment: true,
    notifyStock: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dashboard?.store?.notifications) {
      return;
    }

    setForm({
      notifyNewOrder: Boolean(dashboard.store.notifications.newOrder),
      notifyPayment: Boolean(dashboard.store.notifications.payment),
      notifyStock: Boolean(dashboard.store.notifications.stock),
    });
  }, [dashboard]);

  const submitNotifications = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { response, data } = await fetchWithSession("/api/vendors/notifications", {
        sessionSource: "user",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update notification settings.");
      }

      toast.success("Notification settings updated successfully.");
      refresh({ silent: true });
    } catch (notificationError) {
      toast.error(
        notificationError.message || "Failed to update notification settings."
      );
    } finally {
      setSubmitting(false);
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
          {error || "Unable to load notification settings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="p-5 md:p-8">
        <form
          onSubmit={submitNotifications}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            Alert Preferences
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Choose which vendor emails you receive
          </h2>

          <div className="mt-6 space-y-4">
            {[
              ["notifyNewOrder", "New order alerts", "Receive an email when a new order reaches your store."],
              ["notifyPayment", "Payment alerts", "Get updated when order payments are verified."],
              ["notifyStock", "Low stock alerts", "Receive low stock warnings for your products."],
            ].map(([key, title, description]) => (
              <label
                key={key}
                className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">{description}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving preferences..." : "Save notification preferences"}
          </button>
        </form>
      </div>
    </div>
  );
}
