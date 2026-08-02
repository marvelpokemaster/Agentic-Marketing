import "./globals.css";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SidebarNav } from "@/components/SidebarNav";
import { PageTransition } from "@/components/PageTransition";
import { HUDHeader } from "@/components/HUDHeader";
import { getOptionalUser } from "@/lib/auth";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "Agentic Marketing — Autonomous Campaign Platform",
  description: "Autonomous multi-agent marketing campaign orchestration engine.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the persisted theme before first paint to avoid a flash of the wrong palette. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme_mode");var t=(s==="light"||s==="laboratory")?"light":(s?"dark":(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-foreground font-body min-h-screen antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        <QueryProvider>
          <div className="flex min-h-screen">
            <SidebarNav userEmail={user?.email || null} />

            <div className="flex-1 flex flex-col min-w-0">
              <HUDHeader />

              <main className="flex-1 min-w-0 flex flex-col">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
