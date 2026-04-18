'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchWithSession } from "@/lib/client-fetch";

function formatJoined(values = []) {
  return values.filter(Boolean).join(", ") || "Not provided";
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ vendor }) {
  if (vendor.isBlocked) {
    return (
      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        Blocked
      </span>
    );
  }

  if (vendor.isApproved) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Approved
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [defaultCommission, setDefaultCommission] = useState("10");
  const [loading, setLoading] = useState(true);
  const [savingDefault, setSavingDefault] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        { response: vendorResponse, data: vendorData },
        { response: commissionResponse, data: commissionData },
      ] = await Promise.all([
        fetchWithSession("/api/admin/vendors", {
          sessionSource: "admin",
        }),
        fetchWithSession("/api/admin/settings/commission", {
          sessionSource: "admin",
        }),
      ]);

      if (!vendorResponse.ok) {
        throw new Error(vendorData.error || "Failed to fetch vendors.");
      }

      setVendors(vendorData);

      if (commissionResponse.ok) {
        setDefaultCommission(String(commissionData.commissionRate ?? "10"));
      }
    } catch (loadError) {
      toast.error(loadError.message || "Failed to load vendor administration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateDefaultCommission = async () => {
    setSavingDefault(true);

    try {
      const { response, data } = await fetchWithSession("/api/admin/settings/commission", {
        sessionSource: "admin",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commissionRate: defaultCommission,
        }),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update default commission.");
      }

      toast.success("Default commission updated successfully.");
    } catch (commissionError) {
      toast.error(commissionError.message || "Failed to update default commission.");
    } finally {
      setSavingDefault(false);
    }
  };

  const runVendorAction = async (endpoint, body, successMessage) => {
    try {
      const { response, data } = await fetchWithSession(endpoint, {
        sessionSource: "admin",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(data.error || "Vendor update failed.");
      }

      toast.success(successMessage);
      loadData();
    } catch (actionError) {
      toast.error(actionError.message || "Vendor update failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-5 md:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
          Commission Control
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Platform default commission
        </h1>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={defaultCommission}
            onChange={(event) => setDefaultCommission(event.target.value)}
            className="w-full max-w-xs rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
          />
          <button
            type="button"
            onClick={updateDefaultCommission}
            disabled={savingDefault}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDefault ? "Saving..." : "Save default commission"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Vendor Control
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Review full vendor registration details and verify accounts
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Vendors</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{vendors.length}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor._id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {vendor.vendorProfile?.storeName || vendor.fullName}
                      </h3>
                      <StatusBadge vendor={vendor} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {vendor.email} | {vendor.phoneNumber}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {vendor.vendorProfile?.description || "No store description available."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(vendor.vendorProfile?.categories || []).map((category) => (
                        <span
                          key={`${vendor._id}-${category}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Basic Info</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Full name: <span className="font-semibold text-slate-900">{vendor.fullName}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Email: <span className="font-semibold text-slate-900">{vendor.email}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Phone: <span className="font-semibold text-slate-900">{vendor.phoneNumber}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Password: <span className="font-semibold text-slate-500">Hidden for security</span>
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        Registered {formatDateTime(vendor.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Business Info</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Store name: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.storeName || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Business type: <span className="font-semibold capitalize text-slate-900">{vendor.vendorProfile?.businessType || "Unknown"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Description: <span className="text-slate-900">{vendor.vendorProfile?.description || "No store description available."}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Address</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {formatJoined([
                          vendor.vendorProfile?.address?.address1,
                          vendor.vendorProfile?.address?.address2,
                          vendor.vendorProfile?.address?.city,
                          vendor.vendorProfile?.address?.state,
                          vendor.vendorProfile?.address?.pincode,
                          vendor.vendorProfile?.address?.country,
                        ])}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Bank / Payment</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Account holder: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.payment?.accountHolderName || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Bank name: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.payment?.bankName || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Account number: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.payment?.accountNumber || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        eSewa: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.payment?.esewaId || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Fonepay: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.payment?.fonepayId || "Not provided"}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Verification</p>
                      <p className="mt-2 text-sm text-slate-700">
                        PAN number: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.verification?.panNumber || "Not provided"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Citizenship number: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.verification?.citizenshipNumber || "Not provided"}</span>
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Agreements</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Terms: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.termsAccepted ? "Accepted" : "Pending"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Commission: <span className="font-semibold text-slate-900">{vendor.vendorProfile?.commissionAccepted ? "Accepted" : "Pending"}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Category</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(vendor.vendorProfile?.categories || []).length > 0 ? (
                          (vendor.vendorProfile?.categories || []).map((category) => (
                            <span
                              key={`${vendor._id}-section-${category}`}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No categories selected.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Shipping Setup</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Delivery charge: ${vendor.vendorProfile?.shipping?.deliveryCharge ?? 0}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Delivery areas: {formatJoined(vendor.vendorProfile?.shipping?.deliveryAreas || [])}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Pickup address: {formatJoined([
                          vendor.vendorProfile?.shipping?.pickupAddress?.address1,
                          vendor.vendorProfile?.shipping?.pickupAddress?.address2,
                          vendor.vendorProfile?.shipping?.pickupAddress?.city,
                          vendor.vendorProfile?.shipping?.pickupAddress?.state,
                          vendor.vendorProfile?.shipping?.pickupAddress?.pincode,
                          vendor.vendorProfile?.shipping?.pickupAddress?.country,
                        ])}
                      </p>
                    </div>

                    {(vendor.vendorProfile?.logo || vendor.vendorProfile?.banner) ? (
                      <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                        {vendor.vendorProfile?.logo ? (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <p className="border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                              Logo
                            </p>
                            <img
                              src={vendor.vendorProfile.logo}
                              alt={`${vendor.vendorProfile.storeName || vendor.fullName} logo`}
                              className="h-44 w-full object-cover"
                            />
                          </div>
                        ) : null}
                        {vendor.vendorProfile?.banner ? (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <p className="border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                              Banner
                            </p>
                            <img
                              src={vendor.vendorProfile.banner}
                              alt={`${vendor.vendorProfile.storeName || vendor.fullName} banner`}
                              className="h-44 w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Products</p>
                    <p className="mt-1 font-semibold text-slate-900">{vendor.productCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Orders</p>
                    <p className="mt-1 font-semibold text-slate-900">{vendor.orderCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Commission</p>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={vendor.vendorProfile?.commissionRate ?? 10}
                        onBlur={(event) =>
                          runVendorAction(
                            `/api/admin/vendors/${vendor._id}/commission`,
                            { commissionRate: event.target.value },
                            "Vendor commission updated."
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-orange-400"
                      />
                      <span className="text-sm font-semibold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!vendor.isApproved && (
                  <button
                    type="button"
                    onClick={() =>
                      runVendorAction(
                        `/api/admin/vendors/${vendor._id}/approve`,
                        {},
                        "Vendor approved successfully."
                      )
                    }
                    className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                  >
                    Approve vendor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    runVendorAction(
                      `/api/admin/vendors/${vendor._id}/block`,
                      { isBlocked: !vendor.isBlocked },
                      vendor.isBlocked
                        ? "Vendor unblocked successfully."
                        : "Vendor blocked successfully."
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    vendor.isBlocked
                      ? "bg-slate-900 text-white"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {vendor.isBlocked ? "Unblock vendor" : "Block vendor"}
                </button>
              </div>
            </div>
          ))}

          {vendors.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
              No vendors found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
