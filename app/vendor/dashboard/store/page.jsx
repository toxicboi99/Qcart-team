'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

export default function VendorStorePage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [form, setForm] = useState({
    storeName: "",
    businessType: "individual",
    description: "",
    categories: "",
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dashboard?.store) {
      return;
    }

    setForm({
      storeName: dashboard.store.storeName || "",
      businessType: dashboard.store.businessType || "individual",
      description: dashboard.store.description || "",
      categories: (dashboard.store.categories || []).join(", "),
    });
  }, [dashboard]);

  const submitStore = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (logo) {
        body.append("logo", logo);
      }
      if (banner) {
        body.append("banner", banner);
      }

      const { response, data } = await fetchWithSession("/api/vendors/store", {
        sessionSource: "user",
        method: "PATCH",
        body,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update store settings.");
      }

      toast.success("Store settings updated successfully.");
      refresh({ silent: true });
      setLogo(null);
      setBanner(null);
    } catch (storeError) {
      toast.error(storeError.message || "Failed to update store settings.");
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
          {error || "Unable to load store settings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        <form
          onSubmit={submitStore}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            Store Editor
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Update store identity and profile
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Store name</span>
              <input
                value={form.storeName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, storeName: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Business type</span>
              <select
                value={form.businessType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessType: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Categories</span>
              <input
                value={form.categories}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categories: event.target.value }))
                }
                placeholder="electronics, fashion, grocery"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Store description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setLogo(event.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-[10px] text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:font-semibold file:text-orange-700 hover:file:bg-orange-200"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Banner</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setBanner(event.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-[10px] text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dashboard.store?.logo && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={dashboard.store.logo} alt="Store logo" className="h-40 w-full object-cover" />
              </div>
            )}
            {dashboard.store?.banner && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={dashboard.store.banner} alt="Store banner" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving store settings..." : "Save store settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
