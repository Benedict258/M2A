import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandingNavbar } from "@/components/landing-navbar";
import HeroSection from "@/sections/HeroSection";
import ProblemSection from "@/sections/ProblemSection";
import SolutionSection from "@/sections/SolutionSection";
import HowItWorksSection from "@/sections/HowItWorksSection";
import FeaturesSection from "@/sections/FeaturesSection";
import ArchitectureSection from "@/sections/ArchitectureSection";
import DatasetsSection from "@/sections/DatasetsSection";
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
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ArchitectureSection />
      <DatasetsSection />
      <FooterSection />
    </main>
  );
}
