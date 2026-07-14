/**
 * spec.types.ts — Em Círculo Home Page
 * Static type interfaces for the 6 presentational components.
 * All components are purely presentational (no props, static content).
 * Interfaces defined for extensibility (e.g., future CMS-driven copy).
 */

// ─── COPY CONTRACTS ───────────────────────────────────────────────────────────

/** Represents a single problem/solution card */
export interface HomeCard {
  title: string;
  body: string;
}

/** Represents a numbered step in HowItWorks */
export interface HowItWorksStep {
  step: number;
  description: string;
}

/** CTA button/link contract */
export interface CtaLink {
  label: string;
  href: string;
  ariaLabel: string;
  variant: "primary" | "secondary";
}

// ─── COMPONENT PROP INTERFACES ────────────────────────────────────────────────

/**
 * HeroSection props.
 * In Phase 1, all values are static constants inside the component.
 * This interface exists for future CMS or A/B test injection.
 */
export interface HeroSectionProps {
  headline?: string;
  subtext?: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
}

/**
 * ProblemSection props.
 */
export interface ProblemSectionProps {
  heading?: string;
  cards?: HomeCard[];
}

/**
 * SolutionSection props.
 */
export interface SolutionSectionProps {
  heading?: string;
  cards?: HomeCard[];
}

/**
 * HowItWorksSection props.
 */
export interface HowItWorksSectionProps {
  heading?: string;
  steps?: HowItWorksStep[];
}

/**
 * AccessibilitySection props.
 */
export interface AccessibilitySectionProps {
  heading?: string;
  body?: string;
  features?: string[];
}

/**
 * FinalCtaSection props.
 */
export interface FinalCtaSectionProps {
  heading?: string;
  body?: string;
  cta?: CtaLink;
}

// ─── PAGE-LEVEL TYPES ─────────────────────────────────────────────────────────

/**
 * Aggregated type for the full Home Page content contract.
 * Used if content is ever externalized to a CMS or config file.
 */
export interface HomePageContent {
  hero: HeroSectionProps;
  problem: ProblemSectionProps;
  solution: SolutionSectionProps;
  howItWorks: HowItWorksSectionProps;
  accessibility: AccessibilitySectionProps;
  finalCta: FinalCtaSectionProps;
}
