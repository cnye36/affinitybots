import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd'
import { Toaster } from "@/components/ui/toaster"
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://affinitybots.com' : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "AffinityBots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AffinityBots",
    description: "Build and manage AI agent workflows",
    images: ["/logo.png"],
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
            url={siteUrl}
            logoUrl={`${siteUrl}/logo.png`}
          />
          {children}
          <CookieBanner />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

