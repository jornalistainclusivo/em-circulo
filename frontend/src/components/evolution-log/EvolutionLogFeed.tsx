'use client'

import React from 'react'
import styles from './EvolutionLogFeed.module.css'

export interface EvolutionLog {
  id: string
  report_date: string
  summary_text: string
  mood?: string
  diet?: string
  wellbeing_notes?: string
  author_id: string
}

interface EvolutionLogFeedProps {
  logs: EvolutionLog[]
}

const MOOD_LABELS: Record<string, string> = {
  BOM: 'Bom',
  REGULAR: 'Regular',
  RUIM: 'Ruim',
  MUITO_RUIM: 'Muito Ruim',
}

const DIET_LABELS: Record<string, string> = {
  COMEU_BEM: 'Comeu Bem',
  COMEU_POUCO: 'Comeu Pouco',
  RECUSOU: 'Recusou',
}

const MOOD_CSS: Record<string, string> = {
  BOM: styles.moodBom,
  REGULAR: styles.moodRegular,
  RUIM: styles.moodRuim,
  MUITO_RUIM: styles.moodMuito,
}

const DIET_CSS: Record<string, string> = {
  COMEU_BEM: styles.dietBem,
  COMEU_POUCO: styles.dietPouco,
  RECUSOU: styles.dietRecusou,
}

export default function EvolutionLogFeed({ logs }: EvolutionLogFeedProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <span className={styles.emptyIcon} aria-hidden="true">📋</span>
        <p className={styles.emptyTitle}>Nenhum registro ainda</p>
        <p className={styles.emptyText}>
          Nenhum diário de evolução registrado ainda. Use o formulário acima para criar o primeiro registro.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.feed}>
      <h2 className={styles.feedHeader}>Últimas Atualizações</h2>
      <div className={styles.logList} role="feed" aria-label="Lista de diários de evolução">
        {logs.map(log => (
          <article
            key={log.id}
            className={styles.logCard}
            aria-labelledby={`log-title-${log.id}`}
            tabIndex={0}
          >
            <header className={styles.logHeader}>
              <time
                dateTime={log.report_date}
                className={styles.logDate}
                aria-label={`Data: ${new Date(log.report_date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                {new Date(log.report_date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>

              <div className={styles.badges}>
                {log.mood && (
                  <span
                    className={`${styles.badgeMood} ${MOOD_CSS[log.mood] || ''}`}
                    aria-label={`Humor: ${MOOD_LABELS[log.mood] || log.mood}`}
                  >
                    Humor: {MOOD_LABELS[log.mood] || log.mood}
                  </span>
                )}
                {log.diet && (
                  <span
                    className={`${styles.badgeDiet} ${DIET_CSS[log.diet] || ''}`}
                    aria-label={`Dieta: ${DIET_LABELS[log.diet] || log.diet}`}
                  >
                    Dieta: {DIET_LABELS[log.diet] || log.diet}
                  </span>
                )}
              </div>
            </header>

            <h3 id={`log-title-${log.id}`} className={styles.logTitle}>
              Resumo do Dia
            </h3>
            <p className={styles.logSummary}>
              {log.summary_text}
            </p>

            {log.wellbeing_notes && (
              <div className={styles.wellbeingSection}>
                <h4 className={styles.wellbeingTitle}>
                  Observações de Bem-estar
                </h4>
                <p className={styles.wellbeingText}>
                  {log.wellbeing_notes}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
