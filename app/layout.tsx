import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "spectRa - color accessibility, grounded in vision science",
  description:
    "analyze color contrast, simulate color vision deficiencies, and build accessible palettes. browser-native, no uploads, no tracking.",
  openGraph: {
    title: "spectRa - color accessibility, grounded in vision science",
    description:
      "analyze color contrast, simulate color vision deficiencies, and build accessible palettes. browser-native, no uploads, no tracking.",
    siteName: "spectRa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "spectRa",
    description: "color accessibility, grounded in vision science",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
