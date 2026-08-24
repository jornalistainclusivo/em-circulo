import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import EvolutionLogForm from '../EvolutionLogForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

describe('EvolutionLogForm', () => {
  it('renders correctly with all required fields', () => {
    render(<EvolutionLogForm groupId="group1" recipientId="rec1" token="mock-token" />)
    
    expect(screen.getByLabelText(/Humor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Alimentação/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Resumo do Dia/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar Diário/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<EvolutionLogForm groupId="group1" recipientId="rec1" token="mock-token" />)
    
    const submitButton = screen.getByRole('button', { name: /Salvar Diário/i })
    fireEvent.click(submitButton)
    
    expect(await screen.findByText(/O resumo é obrigatório/i)).toBeInTheDocument()
  })

  it('submits successfully when fields are filled', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    })

    const mockOnSuccess = vi.fn()
    const user = userEvent.setup()
    
    render(<EvolutionLogForm groupId="group1" recipientId="rec1" token="mock-token" onSuccess={mockOnSuccess} />)
    
    await user.selectOptions(screen.getByLabelText(/Humor/i), 'BOM')
    await user.selectOptions(screen.getByLabelText(/Alimentação/i), 'COMEU_BEM')
    await user.type(screen.getByLabelText(/Resumo do Dia/i), 'Passou o dia bem.')
    await user.type(screen.getByLabelText(/Observações/i), 'Dormiu bastante.')
    
    const submitButton = screen.getByRole('button', { name: /Salvar Diário/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
})
