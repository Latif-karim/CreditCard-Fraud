import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fraud Detection Platform",
  description: "Credit card fraud detection monitoring dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
