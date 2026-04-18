'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardSidebar from "@/components/vendor/DashboardSidebar";
import { clearUserSession, getUserSession, isSessionValid } from "@/lib/session";

export default function VendorDashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getUserSession();

    if (!session || !isSessionValid(session)) {
      if (session) {
        clearUserSession();
      }

      router.replace("/signin?return=/vendor/dashboard");
      return;
    }

    const isVendor =
      session.user?.isVendor ||
      session.user?.role === "vendor" ||
      session.user?.role === "seller";

    if (!isVendor) {
      router.replace("/vendor/register");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
