"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import styles from "./Navigation.module.css";

interface NavigationProps {
  isLoggedIn?: boolean;
}

export function Navigation({ isLoggedIn = false }: NavigationProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  
  // Show navigation links only if logged in and NOT on the login page
  const showNav = isLoggedIn && !isLoginPage;

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="Logo Cuida Comigo"
            width={32}
            height={32}
            style={{ height: "32px", width: "auto" }}
          />
          <strong className={styles.brandName}>Cuida Comigo</strong>
        </div>
        <p className={styles.slogan}>Ninguém precisa cuidar sozinho</p>
      </div>

      {showNav && (
        <nav aria-label="Navegação principal" className={styles.nav}>
          <Link
            href="/"
            className={styles.navLink}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Painel
          </Link>
          <Link
            href="/medicamentos"
            className={styles.navLink}
            aria-current={pathname === "/medicamentos" ? "page" : undefined}
          >
            Farmácia
          </Link>
          <Link
            href="/perfil"
            className={styles.navLink}
            aria-current={pathname === "/perfil" ? "page" : undefined}
          >
            Perfil
          </Link>
          <button
            onClick={() => logoutAction()}
            className={styles.navLink}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              color: "var(--color-danger)"
            }}
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  );
}

