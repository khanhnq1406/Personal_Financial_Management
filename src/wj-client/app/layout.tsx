import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
  weight: ["400", "500", "600"], // Only load commonly used weights
  preload: true, // Enable preloading for faster font rendering
  adjustFontFallback: false, // Disable automatic fallback fonts to reduce bundle size
});

export const metadata: Metadata = {
  title: "WealthJourney",
  description:
    "Welcome to WealthJourney - Your Trusted Guide to Financial Freedom",
  icons: "/logo.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${plusJakartaSans.variable} antialiased h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
