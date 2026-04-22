import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatPage } from './ai-chat-page'
import { renderWithProviders } from '../test/utils'
import { setAiAssistantMockState } from '../test/msw/handlers'

describe('AiChatPage', () => {
  it('lista conversaciones, muestra el detalle y permite enviar mensajes al asistente', async () => {
    const user = userEvent.setup()

    renderWithProviders(<AiChatPage />)

    expect((await screen.findAllByText('Normativa sobre adelantamientos')).length).toBeGreaterThan(0)
    expect(await screen.findByText('¿Cuándo está prohibido adelantar en carretera?')).toBeInTheDocument()
    expect(
      (
        await screen.findAllByText(
          'Está prohibido adelantar cuando la maniobra compromete la visibilidad, invade zonas señalizadas o pone en riesgo a otros usuarios.',
        )
      ).length,
    ).toBeGreaterThan(0)

    await user.clear(screen.getByLabelText(/escribe tu pregunta aquí/i))
    await user.type(screen.getByLabelText(/escribe tu pregunta aquí/i), '¿Qué documentación debo llevar?')
    await user.click(screen.getByRole('button', { name: /^enviar$/i }))

    expect(await screen.findByText('¿Qué documentación debo llevar?')).toBeInTheDocument()
    expect((await screen.findAllByText('Respuesta del asistente: ¿Qué documentación debo llevar?')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /\+ nueva conversación/i }))

    expect(await screen.findByText('Todavía no hay mensajes')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/escribe tu pregunta aquí/i), 'Necesito ayuda con las señales verticales')
    await user.click(screen.getByRole('button', { name: /^enviar$/i }))

    expect(await screen.findByText('Necesito ayuda con las señales verticales')).toBeInTheDocument()
    expect((await screen.findAllByText('Respuesta del asistente: Necesito ayuda con las señales verticales')).length).toBeGreaterThan(0)
  })

  it('muestra empty state y permite crear la primera conversación si el historial viene vacío', async () => {
    const user = userEvent.setup()

    setAiAssistantMockState([], [])

    renderWithProviders(<AiChatPage />)

    expect(await screen.findByText('Todavía no tienes conversaciones')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /crear conversación/i }))

    expect(await screen.findByText('Todavía no hay mensajes')).toBeInTheDocument()
  })
})
