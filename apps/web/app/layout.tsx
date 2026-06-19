import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Marketing — Social Campaign Generator",
  description:
    "Upload a product, generate ready-to-post campaigns, and publish to Instagram & Facebook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 font-bold">
              <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_16px_#4edea3]" />
              Agentic Marketing
              <span className="text-sm font-normal text-muted">
                · social campaign studio
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/products" className="chip hover:chip-on">
                Products
              </Link>
              <Link href="/campaigns" className="chip hover:chip-on">
                Campaigns
              </Link>
              <Link href="/products/new" className="btn btn-sm">
                New product
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
