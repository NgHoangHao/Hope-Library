"use client";

import React from "react";
import { LandingPageContent } from "@/features/landing";
import { useLandingRedirect } from "@/features/auth";

export default function LandingPage() {
  const { isChecking } = useLandingRedirect();

  if (isChecking) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F5B82E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LandingPageContent />;
}
