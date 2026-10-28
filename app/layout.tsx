import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Silkscreen } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/CartProvider";
import { DialUpBanner, DialUpMarquee, DialUpSidebar } from "@/components/dialup/DialUpChrome";
import { DialUpFx } from "@/components/dialup/DialUpFx";
import { JsonLd } from "@/components/JsonLd";
import { ERA_SCRIPT } from "@/lib/dialup";
import { POPUP_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Variable Archivo with the width axis so headlines can run at 62–80% stretch.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex-mono" });
// Pixel headings for the Dial-Up Edition only; not preloaded on the normal site.
const silkscreen = Silkscreen({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-silkscreen", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Heavyweight graphics. Zero gimmicks.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  sameAs: [POPUP_URL],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-era is set by ERA_SCRIPT before hydration.
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} ${silkscreen.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ERA_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationLd} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <CartProvider>
          <div className="site-frame">
            <DialUpBanner />
            <DialUpSidebar />
            <div className="site-content">
              <DialUpMarquee />
              <SiteHeader />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
          </div>
          <DialUpFx />
        </CartProvider>
      </body>
    </html>
  );
}
