'use client';

import { useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

export default function VendorEarningsPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitWithdrawRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { response, data } = await fetchWithSession("/api/vendors/withdraw-requests", {
        sessionSource: "user",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          note,
        }),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit withdraw request.");
      }

      toast.success("Withdraw request submitted successfully.");
      setAmount("");
      setNote("");
      refresh({ silent: true });
    } catch (requestError) {
      toast.error(requestError.message || "Failed to submit withdraw request.");
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
          {error || "Unable to load vendor earnings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Total Sales
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              ${dashboard.metrics?.totalSales ?? 0}
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Net Earnings
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              ${dashboard.metrics?.earnings ?? 0}
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
              Commission Deduction
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              ${dashboard.metrics?.commissionDeduction ?? 0}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Payment Records
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {dashboard.paymentHistory?.length ?? 0}
            </p>
          </div>
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Available Payout
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              ${dashboard.payoutStats?.availableBalance ?? 0}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Payment History
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Commission-adjusted earnings
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {(dashboard.paymentHistory || []).map((entry) => (
                <div
                  key={entry._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {entry.note || `Order ${entry.orderId}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{entry.status}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Gross</p>
                        <p className="mt-1 font-semibold text-slate-900">${entry.grossAmount}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Commission</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          ${entry.commissionAmount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Net</p>
                        <p className="mt-1 font-semibold text-emerald-600">${entry.netAmount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {dashboard.paymentHistory?.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
                  No payment history yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <form
              onSubmit={submitWithdrawRequest}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Withdraw Request
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Request vendor payout
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Vendors can submit one payout request every 7 days. Current available
                balance: ${dashboard.payoutStats?.availableBalance ?? 0}
              </p>

              <div className="mt-6 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Amount</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Note</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                    placeholder="Optional payout note"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit withdraw request"}
              </button>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Withdraw Timeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Recent requests
              </h2>

              <div className="mt-6 space-y-4">
                {(dashboard.withdrawRequests || []).map((request) => (
                  <div
                    key={request._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">${request.amount}</p>
                        <p className="mt-1 text-sm text-slate-500">{request.note || "No note"}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}

                {dashboard.withdrawRequests?.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                    No withdraw requests yet.
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
