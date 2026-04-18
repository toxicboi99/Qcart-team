'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchWithSession } from "@/lib/client-fetch";

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || "Pending");
  const styles =
    normalized === "Done"
      ? "bg-emerald-100 text-emerald-700"
      : normalized === "Approved"
        ? "bg-blue-100 text-blue-700"
        : normalized === "Rejected"
          ? "bg-rose-100 text-rose-700"
          : "bg-amber-100 text-amber-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {normalized}
    </span>
  );
}

function PaymentDetails({ vendor }) {
  const payment = vendor?.vendorProfile?.payment;

  if (!payment) {
    return <p className="text-sm text-slate-500">No payout details available.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Bank account</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {payment.accountHolderName || "Not provided"}
        </p>
        <p className="mt-1 text-sm text-slate-600">{payment.bankName || "Bank not provided"}</p>
        <p className="mt-1 text-sm text-slate-500">{payment.accountNumber || "No account number"}</p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Wallet IDs</p>
        <p className="mt-2 text-sm text-slate-600">
          eSewa: {payment.esewaId || "Not provided"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Fonepay: {payment.fonepayId || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  const loadRequests = async () => {
    setLoading(true);

    try {
      const { response, data } = await fetchWithSession("/api/admin/withdraw-requests", {
        sessionSource: "admin",
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to load payout requests.");
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load payout requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequestStatus = async (requestId, status) => {
    setActionId(requestId);

    try {
      const { response, data } = await fetchWithSession(`/api/admin/withdraw-requests/${requestId}`, {
        sessionSource: "admin",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payout request.");
      }

      toast.success(data.message || `Payout request marked as ${status}.`);
      loadRequests();
    } catch (error) {
      toast.error(error.message || "Failed to update payout request.");
    } finally {
      setActionId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-5 md:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Payout Control
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Review weekly vendor payout requests
            </h1>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Requests</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{requests.length}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {request.vendor?.vendorProfile?.storeName || request.vendor?.fullName || "Vendor"}
                    </h2>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="text-sm text-slate-500">
                    <p>{request.vendor?.email || "No email"} | {request.vendor?.phoneNumber || "No phone"}</p>
                    <p className="mt-1">Requested on {formatDateTime(request.createdAt)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">${request.amount}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Request ID</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">#{request._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Business type</p>
                      <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                        {request.vendor?.vendorProfile?.businessType || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vendor note</p>
                    <p className="mt-2 text-sm text-slate-700">{request.note || "No note provided."}</p>
                  </div>

                  <PaymentDetails vendor={request.vendor} />
                </div>

                <div className="flex min-w-[220px] flex-col gap-3">
                  {request.status === "Pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(request._id, "Approved")}
                        disabled={actionId === request._id}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {actionId === request._id ? "Saving..." : "Approve payout"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(request._id, "Rejected")}
                        disabled={actionId === request._id}
                        className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                      >
                        Reject request
                      </button>
                    </>
                  ) : null}

                  {request.status === "Approved" ? (
                    <button
                      type="button"
                      onClick={() => updateRequestStatus(request._id, "Done")}
                      disabled={actionId === request._id}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionId === request._id ? "Saving..." : "Mark as done"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
              No payout requests yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
