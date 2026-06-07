import type { Metadata, Viewport } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050508",
};

export const metadata: Metadata = {
  title: "Cosmo-gram — Twoja astrologia z prawdziwym głosem",
  description:
    "Kosmogram, synastria i chat z astrologiem AI. Oparte na Swiss Ephemeris i Claude AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cosmo-gram",
  },
  openGraph: {
    title: "Cosmo-gram — Twoja astrologia z prawdziwym głosem",
    description: "Kosmogram natury, synastria i chat z astrologiem AI.",
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${montserrat.variable} ${cormorant.variable} antialiased`}>
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
