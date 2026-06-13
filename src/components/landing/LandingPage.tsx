"use client";

import { useReveal } from "@/hooks/useReveal";
import LandingNav from "./LandingNav";
import HeroSky from "./HeroSky";
import NatalWheelDemo from "./NatalWheelDemo";
import SectionHow from "./SectionHow";
import SectionModules from "./SectionModules";
import SectionProof from "./SectionProof";
import SectionPricing from "./SectionPricing";
import SectionFaq from "./SectionFaq";
import SectionFinal from "./SectionFinal";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  useReveal();

  return (
    <div
      className="landing-grain"
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "'General Sans', system-ui, sans-serif",
        overflowX: "hidden",
        minHeight: "100vh",
      }}
    >
      <LandingNav />
      <HeroSky />
      <NatalWheelDemo />
      <SectionHow />
      <SectionModules />
      <SectionProof />
      <SectionPricing />
      <SectionFaq />
      <SectionFinal />
      <LandingFooter />
    </div>
  );
}
