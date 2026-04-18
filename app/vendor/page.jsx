'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getUserSession, isSessionValid } from "@/lib/session";

export default function VendorEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getUserSession();

    if (
      session &&
      isSessionValid(session) &&
      (session.user?.isVendor ||
        session.user?.role === "vendor" ||
        session.user?.role === "seller")
    ) {
      router.replace("/vendor/dashboard");
      return;
    }

    router.replace("/vendor/register");
  }, [router]);

  return null;
}
