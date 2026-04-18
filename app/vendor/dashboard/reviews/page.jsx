'use client';

import { useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

export default function VendorReviewsPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [replyMap, setReplyMap] = useState({});

  const submitReply = async (reviewId) => {
    try {
      const { response, data } = await fetchWithSession(
        `/api/vendors/reviews/${reviewId}/reply`,
        {
          sessionSource: "user",
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reply: replyMap[reviewId] || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(data.error || "Failed to reply to review.");
      }

      toast.success("Review reply saved successfully.");
      refresh({ silent: true });
    } catch (replyError) {
      toast.error(replyError.message || "Failed to reply to review.");
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
          {error || "Unable to load vendor reviews."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        {(dashboard.reviews || []).map((review) => (
          <div
            key={review._id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Product review
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {review.product?.name || "Product"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Rating: {review.rating}/5 • {review.author?.fullName || "Customer"}
                </p>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  {review.comment}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {new Date(review.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {review.reply ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <p className="font-semibold">Your reply</p>
                  <p className="mt-2 leading-7">{review.reply}</p>
                </div>
              ) : null}

              <textarea
                value={replyMap[review._id] ?? review.reply ?? ""}
                onChange={(event) =>
                  setReplyMap((current) => ({
                    ...current,
                    [review._id]: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                placeholder="Write a reply to this review"
              />

              <button
                type="button"
                onClick={() => submitReply(review._id)}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Save reply
              </button>
            </div>
          </div>
        ))}

        {dashboard.reviews?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
            No reviews yet. Customer reviews will appear here when they are submitted.
          </div>
        )}
      </div>
    </div>
  );
}
