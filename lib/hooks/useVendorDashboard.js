'use client';

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchWithSession } from "@/lib/client-fetch";

export function useVendorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const { response, data } = await fetchWithSession("/api/vendors/dashboard", {
        sessionSource: "user",
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to load vendor dashboard.");
      }

      setDashboard(data);
      setError("");
      return data;
    } catch (fetchError) {
      const message = fetchError.message || "Failed to load vendor dashboard.";
      setError(message);
      if (!silent) {
        toast.error(message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    dashboard,
    loading,
    error,
    refresh,
  };
}
