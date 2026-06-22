import type { Metadata, Viewport } from "next";
import { Montserrat, Cormorant_Garamond, Fraunces } from "next/font/google";
import "./globals.css";
import "@/styles/landing-tokens.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/components/AuthContext";
import BottomNav from "@/components/BottomNav";
import { SubscriptionProvider } from "@/components/SubscriptionContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import ChatFAB from "@/components/ChatFAB";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050508",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cosmo-gram.com"),
  title: "Cosmogram — Twój głęboki portret, odczytany z nieba",
  description:
    "Cosmogram łączy dane astronomiczne NASA z wiedzą astrologiczną. Astrea — AI tworzona z astrologami — zamienia je w portret, w którym rozpoznasz siebie. Za darmo, bez karty.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cosmogram",
  },
  openGraph: {
    title: "Cosmogram — Twój głęboki portret, odczytany z nieba",
    description: "Kosmogram natalny, Cosmo Match, Kalendarz i Cosmo Chat — spersonalizowana astrologia oparta na Twoim niebie.",
    type: "website",
    url: "https://www.cosmo-gram.com",
    siteName: "Cosmogram",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Cosmogram" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmogram — Twój głęboki portret, odczytany z nieba",
    description: "Personalizowana astrologia oparta na danych NASA. Za darmo.",
    images: ["/og-default.png"],
  },
  icons: {
    icon: [
      "/favicon.ico",
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${montserrat.variable} ${cormorant.variable} ${fraunces.variable} antialiased`}>
        <PostHogProvider>
          <AuthProvider>
            <SubscriptionProvider>
              {children}
              <ChatFAB />
              <BottomNav />
            </SubscriptionProvider>
          </AuthProvider>
        </PostHogProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});})}`,
          }}
        />
      </body>
    </html>
  );
}
