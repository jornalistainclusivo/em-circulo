'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './EvolutionLogForm.module.css'

interface EvolutionLogFormProps {
  groupId: string
  recipientId: string
  token: string
  onSuccess?: () => void
}

export default function EvolutionLogForm({ groupId, recipientId, token, onSuccess }: EvolutionLogFormProps) {
  const router = useRouter()
  const [mood, setMood] = useState('')
  const [diet, setDiet] = useState('')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!summary.trim()) {
      setError('O resumo é obrigatório.')
      return
    }

    setIsSubmitting(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}/recipients/${recipientId}/weekly-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          report_date: new Date().toISOString(),
          summary_text: summary,
          mood: mood || undefined,
          diet: diet || undefined,
          wellbeing_notes: notes || undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        const msg = typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((e: any) => e.msg).join('; ')
            : 'Falha ao salvar o diário.'
        throw new Error(msg)
      }

      setSummary('')
      setMood('')
      setDiet('')
      setNotes('')
      setSuccess(true)

      router.refresh()

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o diário.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} aria-label="Formulário de diário de evolução">

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success} role="status">
          Diário registrado com sucesso!
        </div>
      )}

      <div className={styles.fieldGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="mood">
              Humor / Estado de Ânimo
            </label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="RUIM">Ruim</option>
              <option value="MUITO_RUIM">Muito Ruim</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="diet">
              Alimentação
            </label>
            <select
              id="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="COMEU_BEM">Comeu bem</option>
              <option value="COMEU_POUCO">Comeu pouco</option>
              <option value="RECUSOU">Recusou alimentação</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="summary">
            Resumo do Dia (Obrigatório)
          </label>
          <textarea
            id="summary"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Como o paciente passou o dia?"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="notes">
            Observações de bem-estar (opcional)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma nota sobre sono, dores ou comportamento?"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn--primary"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Diário'}
        </button>
      </div>
    </form>
  )
}
