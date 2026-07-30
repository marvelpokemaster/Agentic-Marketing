import "./globals.css";
import { SidebarNav } from "@/components/SidebarNav";
import { BackgroundCanvas } from "@/components/BackgroundCanvas";
import { CustomCursor } from "@/components/CustomCursor";
import { PageTransition } from "@/components/PageTransition";
import { HUDHeader } from "@/components/HUDHeader";
import { AIBootSequence } from "@/components/AIBootSequence";
import { getOptionalUser } from "@/lib/auth";

export const metadata = {
  title: "AI Mission Control — Agentic Marketing Platform",
  description: "Autonomous multi-agent marketing campaign orchestration engine.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-foreground font-sans min-h-screen antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        {/* First Visit Session AI Boot Sequence */}
        <AIBootSequence />

        {/* Custom Glow Cursor */}
        <CustomCursor />

        {/* Ambient 3D Particle Canvas */}
        <BackgroundCanvas />

        <div className="flex min-h-screen relative z-10">
          <SidebarNav userEmail={user?.email || null} />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Persistent System HUD */}
            <HUDHeader />

            <main className="flex-1 min-w-0 p-6 md:p-10 flex flex-col">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
