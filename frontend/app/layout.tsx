import "./globals.css";
import type { Metadata } from "next";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "FraudShield | Fraud Detection Platform",
  description: "Enterprise credit card fraud detection, ML scoring, and operations console.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
