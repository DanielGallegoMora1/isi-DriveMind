import userEvent from '@testing-library/user-event'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { TestsPage } from './tests-page'
import { renderWithProviders } from '../test/utils'

describe('TestsPage', () => {
  it('permite generar un test, responderlo y ver el resultado corregido', async () => {
    const user = userEvent.setup()

    const { container } = renderWithProviders(<TestsPage />)

    await screen.findByRole('option', { name: 'B · Turismos' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generar test' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Generar test' }))

    expect(await screen.findAllByText('Pregunta 1')).toHaveLength(2)
    expect(screen.getAllByText('Pregunta 30')).toHaveLength(2)

    for (let index = 1; index <= 30; index += 1) {
      const optionIndex = index <= 3 ? 0 : 1
      const questionOptions = container.querySelectorAll<HTMLInputElement>(`input[name="question-${index}"]`)
      fireEvent.click(questionOptions[optionIndex])
    }

    await user.click(screen.getByRole('button', { name: 'Enviar respuestas' }))

    expect(await screen.findAllByText('Aprobado')).toHaveLength(2)
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/27 correctas · 3 incorrectas/i)).toBeInTheDocument()
    })
  }, 10000)
})
