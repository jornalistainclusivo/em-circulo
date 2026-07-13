"use client";

import { useState, useActionState, useEffect } from "react";
import { loginAction, registerAction } from "../actions/auth";
import styles from "./login.module.css";

interface AuthCardProps {
  invite?: string;
}

export function AuthCard({ invite }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // React 19 useActionState hooks
  const [loginState, loginFormAction, isLoginPending] = useActionState(
    loginAction,
    null
  );

  const [registerState, registerFormAction, isRegisterPending] = useActionState(
    registerAction,
    null
  );

  useEffect(() => {
    if (registerState?.success && registerState?.message) {
      const timer = setTimeout(() => {
        setActiveTab("login");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [registerState]);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>Em Círculo</h1>
        <p className={styles.subtitle}>
          {activeTab === "login"
            ? "Gestão compartilhada de cuidado familiar"
            : "Cadastre-se para compartilhar o cuidado"}
        </p>
      </header>

      {/* Access tab switcher (role tablist for WCAG AAA) */}
      <div className={styles.tabs} role="tablist" aria-label="Opções de Acesso">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "login"}
          aria-controls="login-panel"
          id="tab-login"
          className={`${styles.tab} ${
            activeTab === "login" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("login")}
          disabled={isLoginPending || isRegisterPending}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "register"}
          aria-controls="register-panel"
          id="tab-register"
          className={`${styles.tab} ${
            activeTab === "register" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("register")}
          disabled={isLoginPending || isRegisterPending}
        >
          Criar Conta
        </button>
      </div>

      <div className={styles.formContent}>
        {/* Alerts for API responses (aria-live for screen readers) */}
        <div aria-live="polite">
          {activeTab === "login" && loginState?.error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              {loginState.error}
            </div>
          )}

          {activeTab === "login" && registerState?.message && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              {registerState.message}
            </div>
          )}

          {activeTab === "register" && registerState?.error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              {registerState.error}
            </div>
          )}
        </div>

        {/* Login Panel */}
        {activeTab === "login" && (
          <form
            id="login-panel"
            role="tabpanel"
            aria-labelledby="tab-login"
            action={loginFormAction}
            noValidate
          >
            {invite && <input type="hidden" name="invite" value={invite} />}
            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.label}>
                E-mail
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nome@exemplo.com"
                className={styles.input}
                disabled={isLoginPending}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.label}>
                Senha
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={styles.input}
                disabled={isLoginPending}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: "100%", marginTop: "var(--space-4)" }}
              disabled={isLoginPending}
            >
              {isLoginPending ? "Entrando..." : "Entrar no Painel"}
            </button>
          </form>
        )}

        {/* Register Panel */}
        {activeTab === "register" && (
          <form
            id="register-panel"
            role="tabpanel"
            aria-labelledby="tab-register"
            action={registerFormAction}
            noValidate
          >
            {invite && <input type="hidden" name="invite" value={invite} />}
            <div className={styles.formGroup}>
              <label htmlFor="register-name" className={styles.label}>
                Nome Completo
              </label>
              <input
                id="register-name"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Seu nome"
                className={styles.input}
                disabled={isRegisterPending}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-email" className={styles.label}>
                E-mail
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nome@exemplo.com"
                className={styles.input}
                disabled={isRegisterPending}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-password" className={styles.label}>
                Senha
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className={styles.input}
                disabled={isRegisterPending}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-confirm-password" className={styles.label}>
                Confirmar Senha
              </label>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repita sua senha"
                className={styles.input}
                disabled={isRegisterPending}
              />
            </div>

            <button
              type="submit"
              className="btn btn--accent"
              style={{ width: "100%", marginTop: "var(--space-4)" }}
              disabled={isRegisterPending}
            >
              {isRegisterPending ? "Criando Conta..." : "Criar Conta e Acessar"}
            </button>
          </form>
        )}

        <p className={styles.footerText}>
          Segurança por criptografia JWT nativa e cookies HttpOnly.
        </p>
      </div>
    </div>
  );
}
