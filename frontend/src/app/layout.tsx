import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import { SkipLink } from "@/components/SkipLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuida Comigo",
  description:
    "Ninguém precisa cuidar sozinho. Plataforma de gestão compartilhada para cuidadores informais.",
  manifest: "/manifest.json",
  applicationName: "Cuida Comigo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cuida Comigo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D4F4F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(() => { /* SW registration failed — non-blocking */ });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <SkipLink />

        <header style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <nav aria-label="Navegação principal" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Link href="/" aria-current="page" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", textDecoration: "none", color: "var(--color-primary)" }}>
              <Image src="/logo.png" alt="Logo Cuida Comigo" width={32} height={32} style={{ height: "32px", width: "auto" }} />
              <strong style={{ fontSize: "var(--font-size-lg)" }}>Cuida Comigo</strong>
            </Link>
          </nav>
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: "var(--font-weight-medium)" }}>
            Ninguém precisa cuidar sozinho
          </p>
        </header>

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer>
          <p>
            <small>
              © {new Date().getFullYear()} Cuida Comigo — JINC Apps
            </small>
          </p>
        </footer>
      </body>
    </html>
  );
}
