"use client";

import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingErrorBoundary from "@/components/landing/LandingErrorBoundary";

export default function LandingPage() {
  return (
    <LandingErrorBoundary>
      <div className="min-h-screen bg-neutral-50">
        <LandingNavbar />
        <main id="main-content">
          <LandingHero />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingCTA />
        </main>
        <LandingFooter />
      </div>
    </LandingErrorBoundary>
  );
}
