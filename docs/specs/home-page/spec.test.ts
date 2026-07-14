/**
 * spec.test.ts — Em Círculo Home Page
 * Test specification for the 6 modular components and conversion links.
 *
 * Domains: Unit (Vitest + React Testing Library) + E2E (Playwright)
 * Pattern: AAA (Arrange, Act, Assert)
 */

// ─── UNIT TESTS ──────────────────────────────────────────────────────────────

describe("HeroSection", () => {
  it("renders the main h1 headline", () => {
    // Arrange: render <HeroSection />
    // Act: query by role heading level 1
    // Assert: text matches "Organize sua rede de apoio em um único lugar."
  });

  it("renders the primary CTA linking to /login", () => {
    // Arrange: render <HeroSection />
    // Act: query by role link with name "Criar meu Círculo gratuitamente"
    // Assert: href === "/login"
  });

  it("renders the secondary CTA linking to #como-funciona", () => {
    // Arrange: render <HeroSection />
    // Act: query anchor with text "Conheça a plataforma"
    // Assert: href === "#como-funciona"
  });
});

describe("ProblemSection", () => {
  it("renders the section h2 heading", () => {
    // Assert: "Quando tudo depende de uma pessoa, o cuidado fica mais difícil."
  });

  it("renders exactly 3 problem cards", () => {
    // Assert: 3 <li> elements inside the cards list
  });

  it("renders correct card titles: Sobrecarga, Informações espalhadas, Insegurança", () => {
    // Assert: all 3 h3 headings present with exact text
  });
});

describe("SolutionSection", () => {
  it("renders the section h2 heading", () => {
    // Assert: "Um Círculo organiza tudo."
  });

  it("renders exactly 4 solution cards", () => {
    // Assert: 4 cards rendered
  });
});

describe("HowItWorksSection", () => {
  it("renders the section h2 heading", () => {
    // Assert: "Começar leva apenas alguns minutos."
  });

  it("has id='como-funciona' for anchor link", () => {
    // Assert: section element has id attribute "como-funciona"
  });

  it("renders 3 sequential steps", () => {
    // Assert: 3 step elements with ordered text (1., 2., 3.)
  });
});

describe("AccessibilitySection", () => {
  it("renders the section h2 heading", () => {
    // Assert: "Feita para todas as pessoas."
  });

  it("renders a list of 5 accessibility features", () => {
    // Assert: <ul> with 5 <li> items
  });
});

describe("FinalCtaSection", () => {
  it("renders the section h2 heading", () => {
    // Assert: "Comece seu primeiro Círculo hoje."
  });

  it("renders a CTA linking to /login", () => {
    // Assert: <a href="/login"> with text "Criar meu Círculo"
  });
});

// ─── E2E TESTS (Playwright) ───────────────────────────────────────────────────

describe("Home Page — E2E Conversion Flow", () => {
  it("renders all 6 sections without authentication", async () => {
    // Arrange: navigate to "/" with no auth cookie
    // Act: page.goto("/")
    // Assert: all 6 section headings are visible
  });

  it("redirects authenticated user away from home to dashboard", async () => {
    // Arrange: set cookie cc_access_token with valid mock token
    // Act: page.goto("/")
    // Assert: URL changes to "/dashboard" or "/onboarding"
  });

  it("primary CTA navigates to /login", async () => {
    // Arrange: page.goto("/")
    // Act: click first "Criar meu Círculo" link
    // Assert: URL === "/login"
  });

  it("secondary CTA scrolls to #como-funciona section", async () => {
    // Arrange: page.goto("/")
    // Act: click "Conheça a plataforma"
    // Assert: HowItWorksSection is in viewport
  });

  it("all interactive elements are keyboard-reachable", async () => {
    // Arrange: page.goto("/")
    // Act: tab through all interactive elements
    // Assert: no element is skipped, all CTAs receive focus-visible state
  });

  it("passes axe-core accessibility audit with zero critical violations", async () => {
    // Arrange: page.goto("/")
    // Act: run axe(page)
    // Assert: results.violations.length === 0
  });
});
