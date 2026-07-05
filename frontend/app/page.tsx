import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingSectionMotion } from "@/components/landing/LandingSectionMotion";
import { meta } from "@/constants";
import { appBaseUrl } from "@/lib/app-url";
import {
  Architecture,
  FeaturedProfiles,
  FinalCTA,
  Hero,
  HowItWorks,
  IntegrationEcosystem,
  PassportDemo,
  Pricing,
  Principles,
  Problem,
  ScoreExplainer,
  SocialProof,
  Testimonials,
} from "@/components/landing/Sections";
import { fetchFeaturedProfiles } from "@/lib/featuredProfiles";

const homeOgImage = `${appBaseUrl()}/opengraph-image`;

export const metadata: Metadata = {
  title: meta.defaultTitle,
  description: meta.homeOgDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: meta.homeOgTitle,
    description: meta.homeOgDescription,
    siteName: "TrustGraph",
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: meta.homeOgTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.homeOgTitle,
    description: meta.homeOgDescription,
    images: [homeOgImage],
  },
};

export default async function HomePage() {
  const profiles = await fetchFeaturedProfiles();

  return (
    <>
      <LandingNavbar />
      <LandingSectionMotion>
        <main className="w-full min-w-0 overflow-x-clip">
          <Hero />
          <SocialProof />
          <PassportDemo />
          <Problem />
          <Architecture />
          <HowItWorks />
          <Testimonials />
          <FeaturedProfiles profiles={profiles} />
          <ScoreExplainer />
          <IntegrationEcosystem />
          <Pricing />
          <Principles />
          <FinalCTA />
        </main>
      </LandingSectionMotion>
      <Footer />
    </>
  );
}
