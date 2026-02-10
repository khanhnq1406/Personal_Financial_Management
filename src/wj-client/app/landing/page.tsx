"use client";

import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingInvestmentFeatures from "@/components/landing/LandingInvestmentFeatures";
import LandingComparison from "@/components/landing/LandingComparison";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingErrorBoundary from "@/components/landing/LandingErrorBoundary";
import { PWAInstallPrompt } from "@/components/pwa";

export default function LandingPage() {
  return (
    <LandingErrorBoundary>
      <div className="landing-scroll-container h-full overflow-y-auto min-h-screen bg-neutral-50">
        <LandingNavbar />
        <main id="main-content" className="pt-14 sm:pt-16">
          <LandingHero />
          <LandingFeatures />
          <LandingInvestmentFeatures />
          <LandingComparison />
          {/* <LandingTestimonials /> */}
          <LandingHowItWorks />
          <LandingCTA />
        </main>
        <LandingFooter />
        <PWAInstallPrompt showDelay={3000} />
      </div>
    </LandingErrorBoundary>
  );
}
