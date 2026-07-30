import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { BackgroundCanvas } from "@/components/BackgroundCanvas";
import { SidebarNav } from "@/components/SidebarNav";
import { CustomCursor } from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Agentic Marketing — AI Mission Control",
  description:
    "Stateless multi-agent marketing studio for product research, positioning, strategy, content generation, and Meta social broadcasting.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;
  try {
    const user = await getCurrentUser();
    email = user.email;
  } catch {
    // Not logged in
  }

  return (
    <html lang="en" className="dark">
      <body className="antialiased grid-bg relative text-slate-100 bg-[#050508] min-h-screen flex">
        <BackgroundCanvas />
        <CustomCursor />

        <div className="flex w-full min-h-screen relative z-10">
          <SidebarNav userEmail={email} />
          
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 px-6 sm:px-10 py-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
