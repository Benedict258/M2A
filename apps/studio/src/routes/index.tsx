import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing-navbar";
import HeroSection from "@/sections/HeroSection";
import ProblemSection from "@/sections/ProblemSection";
import SolutionSection from "@/sections/SolutionSection";
import HowItWorksSection from "@/sections/HowItWorksSection";
import FeaturesSection from "@/sections/FeaturesSection";
import ArchitectureSection from "@/sections/ArchitectureSection";
import DatasetsSection from "@/sections/DatasetsSection";
import CommunitySection from "@/sections/CommunitySection";
import CTASection from "@/sections/CTASection";
import FooterSection from "@/sections/FooterSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "M2A — On-Chain Agent Memory & Workflow Orchestration" },
      { name: "description", content: "Persistent, verifiable memory for AI agents — powered by Walrus, anchored on Sui. Build workflows where agents share context and learn across runs." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <LandingNavbar scrolled={scrolled} />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ArchitectureSection />
      <DatasetsSection />
      <CommunitySection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
