import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopHeader } from "@/components/top-header";
import { BottomNav } from "@/components/bottom-nav";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CMPND",
  description: "Personal Instagram Reels analytics & content agents",
  // app/manifest.ts is an automatic file convention — Next injects the
  // <link rel="manifest"> itself, no need to reference it here.
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CMPND",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#574ede" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <RegisterServiceWorker />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <div className="flex min-h-svh flex-col bg-background">
              <TopHeader />
              <main className="flex flex-1 flex-col gap-4 p-4 pb-32 md:p-6 md:pb-32">
                {children}
              </main>
              <BottomNav />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
