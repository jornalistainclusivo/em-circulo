"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";

export function Navigation() {
  const pathname = usePathname();

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
      </nav>
    </header>
  );
}
