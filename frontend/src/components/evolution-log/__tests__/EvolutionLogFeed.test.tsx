import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EvolutionLogFeed from '../EvolutionLogFeed'

describe('EvolutionLogFeed', () => {
  it('renders empty state when no logs provided', () => {
    render(<EvolutionLogFeed logs={[]} />)
    expect(screen.getByText(/Nenhum registro ainda/i)).toBeInTheDocument()
  })

  it('renders a list of logs', () => {
    const mockLogs = [
      {
        id: '1',
        report_date: '2023-10-25T10:00:00Z',
        summary_text: 'Tudo tranquilo',
        mood: 'BOM',
        author_id: 'auth1'
      },
      {
        id: '2',
        report_date: '2023-10-24T10:00:00Z',
        summary_text: 'Agitação noturna',
        diet: 'COMEU_POUCO',
        wellbeing_notes: 'Dificuldade para dormir',
        author_id: 'auth2'
      }
    ]

    render(<EvolutionLogFeed logs={mockLogs} />)
    
    expect(screen.getByText('Tudo tranquilo')).toBeInTheDocument()
    expect(screen.getByText('Agitação noturna')).toBeInTheDocument()
    expect(screen.getByText(/Humor: Bom/i)).toBeInTheDocument()
    expect(screen.getByText(/Dieta: Comeu Pouco/i)).toBeInTheDocument()
    expect(screen.getByText('Dificuldade para dormir')).toBeInTheDocument()
  })
})
