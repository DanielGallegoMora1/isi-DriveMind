import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestsPage } from './tests-page'
import { renderWithProviders } from '../test/utils'

describe('TestsPage', () => {
  it('renderiza el flujo real de selección de test desde la ruta de tests', () => {
    renderWithProviders(<TestsPage />)

    expect(screen.getByRole('button', { name: /volver al dashboard/i })).toBeInTheDocument()
    expect(screen.getByText('Selecciona el permiso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comenzar permiso b - turismos/i })).toBeInTheDocument()
  })

  it('permite generar, responder y enviar un test real contra la api mockeada', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TestsPage />)

    await user.click(screen.getByRole('button', { name: /comenzar permiso b - turismos/i }))
    await user.click(screen.getByRole('button', { name: /test aleatorio/i }))

    expect(await screen.findByText('Mapa de preguntas')).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === 'Pregunta 1 de 30')).toBeInTheDocument()
    expect(screen.getByText('0/30 respondidas')).toBeInTheDocument()

    for (let questionNumber = 1; questionNumber <= 30; questionNumber += 1) {
      await user.click(screen.getByRole('button', { name: new RegExp(`B Opción B ${questionNumber}`, 'i') }))

      if (questionNumber < 30) {
        await user.click(screen.getByRole('button', { name: /siguiente/i }))
      }
    }

    expect(screen.getByText('30/30 respondidas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /finalizar test/i }))

    expect(await screen.findByRole('heading', { name: 'Aprobado' })).toBeInTheDocument()
    expect(screen.getByText('Desglose por tema')).toBeInTheDocument()
    expect(screen.getByText(/30 correctas · 0 incorrectas/i)).toBeInTheDocument()
  })
})
