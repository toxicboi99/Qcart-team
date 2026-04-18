'use client';

import { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";

function getStatusMeta(vendor) {
  if (vendor?.isBlocked) {
    return {
      label: "Blocked",
      tone: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }

  if (vendor?.isApproved) {
    return {
      label: "Approved",
      tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  return {
    label: "Pending Approval",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
  };
}

export default function DashboardHeader({ dashboard }) {
  const { logout } = useAppContext();
  const status = useMemo(
    () => getStatusMeta(dashboard?.vendor),
    [dashboard?.vendor]
  );

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
          Vendor Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {dashboard?.store?.storeName || "Your store"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage products, orders, payments, reviews, and storefront settings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${status.tone}`}
        >
          {status.label}
        </span>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Commission
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {dashboard?.store?.commissionRate ?? 0}%
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
