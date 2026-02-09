import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WealthJourney - Your Trusted Guide to Financial Freedom",
  description: "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey with WealthJourney. Free personal finance management.",
  keywords: [
    "personal finance",
    "budget tracking",
    "expense management",
    "financial planning",
    "wallet management",
  ],
  authors: [{ name: "WealthJourney" }],
  openGraph: {
    title: "WealthJourney - Your Trusted Guide to Financial Freedom",
    description: "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey.",
    type: "website",
    url: "https://wealthjourney.app",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "WealthJourney Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WealthJourney - Your Trusted Guide to Financial Freedom",
    description: "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
