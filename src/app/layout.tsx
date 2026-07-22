import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
  title: "LEE YEON",
  description: "Community · Contents · Membership · Shop",
  appleWebApp: {
    capable: true,
    title: "LEE YEON",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.variable} ${newsreader.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        {children}
        <ServiceWorkerRegister />
        <PwaInstallBanner />
      </body>
    </html>
  );
}
