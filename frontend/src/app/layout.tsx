import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SkipLink } from "@/components/SkipLink";
import { Navigation } from "@/components/Navigation";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("cc_access_token");

  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <SkipLink />

        <Navigation isLoggedIn={isLoggedIn} />

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

        {/* Sonner Toaster — Design System Teal/Amber */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface, #ffffff)",
              color: "var(--color-text-primary, #111827)",
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(13,79,79,0.12)",
              fontFamily: "inherit",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
