'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/vendor/dashboard", label: "Overview" },
  { href: "/vendor/dashboard/products", label: "Products" },
  { href: "/vendor/dashboard/orders", label: "Orders" },
  { href: "/vendor/dashboard/earnings", label: "Earnings" },
  { href: "/vendor/dashboard/shipping", label: "Shipping" },
  { href: "/vendor/dashboard/reviews", label: "Reviews" },
  { href: "/vendor/dashboard/store", label: "Store" },
  { href: "/vendor/dashboard/notifications", label: "Notifications" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
          Vendor Space
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Seller dashboard
        </h2>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4">
        {links.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
