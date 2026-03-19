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
  title: "UniHub",
  description: "University schedule & exam tracker for Agricultural University of Georgia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniHub",
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
        {/* Prevent theme flash: must run before any CSS paints */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=JSON.parse(localStorage.getItem('unischedule_theme')||'"system"');if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();` }} />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={`${notoSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <ServiceWorkerRegistrar />
          <div className="md:flex">
            <SidebarNav />
            <div className="flex-1 md:ml-60">
              <Header />
              <InstallPrompt />
              <main className="pt-14 pb-20 md:pb-8 min-h-screen flex flex-col">{children}</main>
            </div>
          </div>
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
