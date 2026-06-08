import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Soul Volks — Matese Volks Camp 2026",
  description: "Auto d'epoca, musica dal vivo, mercatini vintage. 7-8-9 Agosto 2026, Campitello Matese (CB). Prenota il tuo biglietto.",
  keywords: "soul volks, matese volks camp, volkswagen, auto d'epoca, campitello matese, molise, evento",
  authors: [{ name: "Soul Volks" }],
  openGraph: {
    title: "Soul Volks — Matese Volks Camp 2026",
    description: "Auto d'epoca, musica dal vivo, mercatini vintage. 7-8-9 Agosto 2026, Campitello Matese (CB).",
    url: "https://soulvolks.it",
    siteName: "Soul Volks",
    images: [
      {
        url: "https://soulvolks.it/icons/soulvolks-og.jpg",
        width: 1200,
        height: 630,
        alt: "Soul Volks — Matese Volks Camp 2026",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soul Volks — Matese Volks Camp 2026",
    description: "Auto d'epoca, musica dal vivo, mercatini vintage. 7-8-9 Agosto 2026, Campitello Matese (CB).",
    images: ["https://soulvolks.it/icons/twitter-card.jpg"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/favicon-256x256.png", sizes: "256x256", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/icons/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167x167.png", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/icons/android-192x192.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <Script src="https://cs.iubenda.com/autoblocking/3729605.js" strategy="beforeInteractive" />
        <Script src="//cdn.iubenda.com/cs/iubenda_cs.js" strategy="afterInteractive" />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}