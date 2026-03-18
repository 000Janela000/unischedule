import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/layout/sw-registrar";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniSchedule",
  description: "University schedule & exam tracker for Agricultural University of Georgia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniSchedule",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <LanguageProvider>
          <ServiceWorkerRegistrar />
          <div className="md:flex">
            <SidebarNav />
            <div className="flex-1 md:ml-60">
              <Header />
              <InstallPrompt />
              <main className="pt-14 pb-16 md:pb-6 min-h-screen">{children}</main>
            </div>
          </div>
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
