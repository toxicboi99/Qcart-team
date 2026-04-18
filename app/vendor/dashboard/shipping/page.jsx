'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

export default function VendorShippingPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [form, setForm] = useState({
    deliveryCharge: "",
    deliveryAreas: "",
    pickupAddress1: "",
    pickupAddress2: "",
    pickupCity: "",
    pickupState: "",
    pickupPincode: "",
    pickupCountry: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dashboard?.store?.shipping) {
      return;
    }

    const pickup = dashboard.store.shipping.pickupAddress || {};
    setForm({
      deliveryCharge: String(dashboard.store.shipping.deliveryCharge ?? ""),
      deliveryAreas: (dashboard.store.shipping.deliveryAreas || []).join(", "),
      pickupAddress1: pickup.address1 || "",
      pickupAddress2: pickup.address2 || "",
      pickupCity: pickup.city || "",
      pickupState: pickup.state || "",
      pickupPincode: pickup.pincode || "",
      pickupCountry: pickup.country || "",
    });
  }, [dashboard]);

  const submitShipping = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { response, data } = await fetchWithSession("/api/vendors/shipping", {
        sessionSource: "user",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update shipping settings.");
      }

      toast.success("Shipping settings updated successfully.");
      refresh({ silent: true });
    } catch (shippingError) {
      toast.error(shippingError.message || "Failed to update shipping settings.");
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
          {error || "Unable to load shipping settings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="p-5 md:p-8">
        <form
          onSubmit={submitShipping}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            Shipping Setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Delivery charges, service areas, and pickup address
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Delivery charge</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.deliveryCharge}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryCharge: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Delivery areas</span>
              <textarea
                value={form.deliveryAreas}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryAreas: event.target.value }))
                }
                placeholder="Kathmandu, Lalitpur, Bhaktapur"
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Pickup address 1</span>
              <input
                value={form.pickupAddress1}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pickupAddress1: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Pickup address 2</span>
              <input
                value={form.pickupAddress2}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pickupAddress2: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            {[
              ["pickupCity", "Pickup city"],
              ["pickupState", "Pickup state"],
              ["pickupPincode", "Pickup pincode"],
              ["pickupCountry", "Pickup country"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving shipping settings..." : "Save shipping settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
