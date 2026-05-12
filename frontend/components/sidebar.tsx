"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, LogIn, Shield } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/transactions", label: "Transactions", icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: Shield },
  { href: "/login", label: "Login", icon: LogIn },
];

export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={`border-r border-slate-800 bg-slate-950/90 px-4 py-6 ${className}`}>
      <h2 className="mt-0 text-xl font-semibold tracking-tight">FraudShield</h2>
      <p className="text-soft text-xs uppercase tracking-wider">Risk Intelligence Console</p>
      <nav className="mt-6 grid gap-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
                pathname === item.href
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="glass-card mt-8 p-3 text-xs text-slate-300">
        <p className="mb-1 font-medium text-white">System Status</p>
        <p>Rule engine, ML scoring and transaction monitoring are online.</p>
      </div>
    </aside>
  );
}
