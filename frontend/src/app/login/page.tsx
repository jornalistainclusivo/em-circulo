import { AuthCard } from "./AuthCard";
import styles from "./login.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesso — Cuida Comigo",
  description: "Faça login ou crie sua conta para gerenciar e compartilhar o cuidado.",
};

interface LoginPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { invite } = await searchParams;

  return (
    <div className={styles.container}>
      <AuthCard invite={invite} />
    </div>
  );
}
