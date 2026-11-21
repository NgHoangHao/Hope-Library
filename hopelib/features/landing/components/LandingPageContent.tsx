"use client";

import React from "react";
import { LandingHeroSection } from "./LandingHeroSection";
import { LandingAboutSection } from "./LandingAboutSection";
import { LandingServicesSection } from "./LandingServicesSection";
import { LandingVisitSection } from "./LandingVisitSection";

export function LandingPageContent() {
  return (
    <div className="w-full flex flex-col">
      <LandingHeroSection />
      <LandingAboutSection />
      <LandingServicesSection />
      <LandingVisitSection />
    </div>
  );
}
