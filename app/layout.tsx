import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd'
import { Toaster } from "@/components/ui/toaster"
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";
import { SupportWidget } from "@/components/support-widget/SupportWidget";

const inter = Inter({ subsets: ["latin"] });



export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://affinitybots.com"),
  title: {
    default: "AffinityBots",
    template: "%s | AffinityBots",
  },
  description: "Build and manage AI agent workflows",
  keywords: [
    "AI agents",
    "workflow automation",
    "agent workflows",
    "AI orchestration",
    "AffinityBots",
  ],
  applicationName: "AffinityBots",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "AffinityBots",
    siteName: "AffinityBots",
    description: "Build and manage AI agent workflows",
    images: [
      {
        url: "/images/AffinityBots-homepage-dark-theme-no-header-9-22-25.png",
        width: 1200,
        height: 630,
        alt: "AffinityBots - Four AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AffinityBots",
    description: "Build and manage AI agent workflows",
    images: ["/images/AffinityBots-homepage-dark-theme-no-header-9-22-25.png"],
  },
  robots: process.env.NODE_ENV === 'production'
    ? { index: true, follow: true }
    : { index: false, follow: false },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <OrganizationJsonLd
            name="AffinityBots"
            url={process.env.NEXT_PUBLIC_BASE_URL ?? "https://affinitybots.com"}
            logoUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://affinitybots.com"}/images/AffinityBots-homepage-dark-theme-no-header-12-22-25.png`}
          />
          {children}
          <CookieBanner />
          <Toaster />
          <Analytics />
          <SupportWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}

