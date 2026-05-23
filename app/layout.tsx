import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Soul Volks — Matese Volks Camp 2026",
  description: "Prenota il tuo posto al Matese Volks Camp 2026 — 7·8·9 Agosto, Campitello Matese (CB)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}