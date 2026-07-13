"use client";

import { useActionState } from "react";
import { createCareGroupAction, createCareRecipientAction } from "../actions/auth";
import styles from "./onboarding.module.css";

interface OnboardingWizardProps {
  initialStep?: 1 | 2;
  initialCareGroupId?: string;
}

export function OnboardingWizard({ initialStep = 1, initialCareGroupId = "" }: OnboardingWizardProps) {
  // Step 1: Create Care Group Action State
  const [groupState, groupFormAction, isGroupPending] = useActionState(
    createCareGroupAction,
    null
  );

  // Step 2: Create Care Recipient Action State
  const [recipientState, recipientFormAction, isRecipientPending] = useActionState(
    createCareRecipientAction,
    null
  );

  // Derive step and careGroupId from state (satisfies react-hooks/set-state-in-effect)
  const isStep1Finished = !!(groupState?.success && groupState?.group_id) || initialStep === 2;
  const step = isStep1Finished ? 2 : 1;
  const careGroupId = groupState?.group_id || initialCareGroupId;

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bem-vindo ao Em Círculo</h1>
        <p className={styles.subtitle}>
          {step === 1
            ? "Vamos começar configurando seu Círculo de Cuidado"
            : "Agora, cadastre a pessoa que receberá os cuidados"}
        </p>
      </header>

      {/* Wizard Progress Indicator */}
      <div className={styles.stepsIndicator} role="navigation" aria-label="Progresso de Onboarding">
        <div
          className={`${styles.stepIndicator} ${
            step === 1 ? styles.stepIndicatorActive : styles.stepIndicatorDone
          }`}
        >
          1. Círculo de Cuidado
        </div>
        <div
          className={`${styles.stepIndicator} ${
            step === 2 ? styles.stepIndicatorActive : ""
          }`}
        >
          2. Paciente
        </div>
      </div>

      <div className={styles.formContent}>
        {/* Error Notification Area */}
        <div aria-live="polite">
          {step === 1 && groupState?.error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              {groupState.error}
            </div>
          )}
          {step === 2 && recipientState?.error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              {recipientState.error}
            </div>
          )}
        </div>

        {/* STEP 1: Care Group Creation */}
        {step === 1 && (
          <form action={groupFormAction} noValidate>
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              Um <strong>Círculo de Cuidado</strong> é o grupo de familiares e cuidadores que dividem a rotina de atenção.
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="group-name" className={styles.label}>
                Nome do Círculo de Cuidado
              </label>
              <input
                id="group-name"
                name="name"
                type="text"
                required
                placeholder="Ex: Família Silva, Cuidado Vovó Maria"
                className={styles.input}
                disabled={isGroupPending}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isGroupPending}
              >
                {isGroupPending ? "Criando Grupo..." : "Criar Grupo e Avançar"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Care Recipient Creation */}
        {step === 2 && (
          <form action={recipientFormAction} noValidate>
            {/* Pass the care group ID to the backend Action */}
            <input type="hidden" name="care_group_id" value={careGroupId} />

            <div className={styles.formGroup}>
              <label htmlFor="recipient-name" className={styles.label}>
                Nome do Paciente / Assistido
              </label>
              <input
                id="recipient-name"
                name="name"
                type="text"
                required
                placeholder="Ex: Maria Silva"
                className={styles.input}
                disabled={isRecipientPending}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="recipient-blood" className={styles.label}>
                  Tipo Sanguíneo (Opcional)
                </label>
                <select
                  id="recipient-blood"
                  name="blood_type"
                  className={styles.select}
                  disabled={isRecipientPending}
                >
                  <option value="">Não informado</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="recipient-allergies" className={styles.label}>
                Alergias (Opcional)
              </label>
              <input
                id="recipient-allergies"
                name="allergies"
                type="text"
                placeholder="Ex: Dipirona, Penicilina (separe por vírgulas)"
                className={styles.input}
                disabled={isRecipientPending}
              />
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Contato de Emergência</legend>
              
              <div className={styles.formGroup}>
                <label htmlFor="contact-name" className={styles.label}>
                  Nome do Contato
                </label>
                <input
                  id="contact-name"
                  name="contact_name"
                  type="text"
                  placeholder="Ex: Filho, Vizinho, SAMU"
                  className={styles.input}
                  disabled={isRecipientPending}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="contact-phone" className={styles.label}>
                  Telefone de Contato
                </label>
                <input
                  id="contact-phone"
                  name="contact_phone"
                  type="tel"
                  placeholder="Ex: (11) 99999-9999 ou 192"
                  className={styles.input}
                  disabled={isRecipientPending}
                />
              </div>
            </fieldset>

            <div className={styles.actions}>
              <button
                type="submit"
                className="btn btn--accent"
                disabled={isRecipientPending}
              >
                {isRecipientPending ? "Finalizando Onboarding..." : "Concluir Cadastro"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
