"use client";

import { useState } from "react";
import type { MedicationProtocol, MedicationLogTimeline } from "@/types";
import styles from "./MedicationPanel.module.css";
import { CreateProtocolForm } from "./CreateProtocolForm";
import { updateProtocolAction, deleteProtocolAction } from "../app/actions";
import { EditFormModal } from "./EditFormModal";

interface MedicationPanelProps {
  recipientId: string;
  recipientName: string;
  protocols: MedicationProtocol[];
  logs: MedicationLogTimeline[];
  members?: import("@/types").CareGroupMember[];
  userNames?: Record<string, string>;
  onLogMedication: (protocolId: string) => Promise<{ success: boolean; stock_alert?: boolean; remaining_balance?: number; error?: string } | void>;
}

export function MedicationPanel({ recipientId, recipientName, protocols, logs, members = [], userNames = {}, onLogMedication }: MedicationPanelProps) {
  const [activeTab, setActiveTab] = useState<"protocols" | "logs">("protocols");
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<MedicationProtocol | null>(null);
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
  const [deletingProtocolName, setDeletingProtocolName] = useState("");

  const handleOpenConfirm = (protocolId: string) => {
    setSelectedProtocolId(protocolId);
  };

  const handleCloseConfirm = () => {
    setSelectedProtocolId(null);
  };

  const handleConfirmDose = async (protocolId: string) => {
    setIsSubmitting(true);
    try {
      const result = await onLogMedication(protocolId);
      setSelectedProtocolId(null);

      if (result && result.success && result.stock_alert) {
        setToastMessage(`Atenção: O estoque crítico foi atingido (${result.remaining_balance} restantes). Uma tarefa de reposição foi gerada.`);
        setTimeout(() => setToastMessage(null), 8000);
      }
    } catch (error) {
      console.error("Falha ao registrar dose", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <h2>Meus Medicamentos</h2>
        {!isCreating && activeTab === "protocols" && (
          <button
            className="btn btn--primary"
            onClick={() => setIsCreating(true)}
          >
            Novo Medicamento
          </button>
        )}
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          className={`${styles.tab} ${activeTab === "protocols" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("protocols")}
          role="tab"
          aria-selected={activeTab === "protocols"}
        >
          💊 Estoque Atual
        </button>
        <button
          className={`${styles.tab} ${activeTab === "logs" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("logs")}
          role="tab"
          aria-selected={activeTab === "logs"}
        >
          📋 Histórico de Doses
        </button>
      </div>
      
      {toastMessage && (
        <div className={styles.toast} role="alert" aria-live="assertive">
          {toastMessage}
          <button className={styles.toastClose} onClick={() => setToastMessage(null)} aria-label="Fechar alerta">&times;</button>
        </div>
      )}

      {isCreating && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <CreateProtocolForm
            recipientId={recipientId}
            members={members}
            userNames={userNames}
            onClose={() => setIsCreating(false)}
          />
        </div>
      )}

      {activeTab === "protocols" ? (
        protocols.length === 0 ? (
          !isCreating && (
            <div className={styles.emptyCard} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">💊</span>
              <h3 className={styles.emptyTitle}>Farmácia Vazia</h3>
              <p className={styles.emptyText}>
                Não há nenhum medicamento cadastrado para o paciente <strong>{recipientName}</strong>.
              </p>
              <button
                type="button"
                className="btn btn--accent"
                onClick={() => setIsCreating(true)}
              >
                Cadastrar Primeiro Medicamento
              </button>
            </div>
          )
        ) : (
          <div className={styles.list}>
            {protocols.map((protocol) => {
              const isLowStock = protocol.stock_count <= protocol.safety_threshold;
              const isConfirming = selectedProtocolId === protocol.id;

              return (
                <div 
                  key={protocol.id} 
                  className={`${styles.card} ${isLowStock ? styles.cardLowStock : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.info}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                        <h3 className={styles.name}>{protocol.medication_name}</h3>
                        <div style={{ display: "flex", gap: "var(--space-1)" }}>
                          <button
                            type="button"
                            className="btn btn--secondary"
                            style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", border: "1px solid var(--color-border)" }}
                            onClick={() => setEditingProtocol(protocol)}
                            aria-label={`Editar Medicamento: ${protocol.medication_name}`}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", backgroundColor: "var(--color-danger)", color: "#fff" }}
                            onClick={() => {
                              setDeletingProtocolId(protocol.id);
                              setDeletingProtocolName(protocol.medication_name);
                            }}
                            aria-label={`Excluir Medicamento: ${protocol.medication_name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className={styles.details}>
                        {protocol.dosage} • A cada {protocol.frequency_interval_hours}h
                      </p>
                    </div>
                    <div className={styles.stock}>
                      <span className={styles.stockLabel}>Estoque</span>
                      <strong className={styles.stockCount}>{protocol.stock_count} un.</strong>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button 
                      className={styles.logButton}
                      onClick={() => handleOpenConfirm(protocol.id)}
                      aria-expanded={isConfirming}
                      aria-controls={`confirm-panel-${protocol.id}`}
                    >
                      Registrar Dose
                    </button>
                  </div>

                  {isConfirming && (
                    <div 
                      id={`confirm-panel-${protocol.id}`}
                      className={styles.confirmPanel}
                      role="region"
                      aria-label="Confirmar administração de dose"
                    >
                      <p>Tem certeza que deseja registrar a administração desta dose?</p>
                      <div className={styles.confirmActions}>
                        <button 
                          className={styles.cancelButton}
                          onClick={handleCloseConfirm}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </button>
                        <button 
                          className={styles.submitButton}
                          onClick={() => handleConfirmDose(protocol.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Registrando..." : "Confirmar Dose"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        logs.length === 0 ? (
          <div className={styles.emptyCard} role="status">
            <span className={styles.emptyIcon} aria-hidden="true">📋</span>
            <h3 className={styles.emptyTitle}>Nenhum Registro</h3>
            <p className={styles.emptyText}>
              Nenhuma dose de medicamento foi administrada ou registrada ainda para o paciente <strong>{recipientName}</strong>.
            </p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {logs.map((log) => {
              const formattedDate = new Date(log.administered_at).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              });

              return (
                <div key={log.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} aria-hidden="true" />
                  <div className={styles.timelineCard}>
                    <div className={styles.timelineHeader}>
                      <h3 className={styles.timelineTitle}>{log.medication_name}</h3>
                      <time className={styles.timelineTime} dateTime={log.administered_at}>
                        {formattedDate}
                      </time>
                    </div>
                    <div className={styles.timelineMeta}>
                      <span className={styles.timelineDosage}>{log.dosage}</span>
                      <span className={styles.timelineUserTag} title="Administrado por">
                        👤 {log.administered_by}
                      </span>
                    </div>
                    {log.notes && (
                      <p className={styles.timelineNotes}>
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {editingProtocol && (
        <EditFormModal
          title={`Editar Medicamento: ${editingProtocol.medication_name}`}
          type="protocol"
          initialData={editingProtocol}
          members={members}
          userNames={userNames}
          onClose={() => setEditingProtocol(null)}
          onSubmitAction={updateProtocolAction.bind(null, editingProtocol.id)}
        />
      )}

      {deletingProtocolId && (
        <EditFormModal
          title={`Excluir Medicamento: ${deletingProtocolName}`}
          type="delete_confirm"
          onClose={() => {
            setDeletingProtocolId(null);
            setDeletingProtocolName("");
          }}
          onDeleteAction={() => deleteProtocolAction(deletingProtocolId)}
        />
      )}
    </section>
  );
}
