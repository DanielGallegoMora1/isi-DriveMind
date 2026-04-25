import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestsPage } from './tests-page'
import { renderWithProviders } from '../test/utils'

describe('TestsPage', () => {
  it('muestra el panel Mis Tests con métricas, CTA e historial filtrable', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TestsPage />)

    expect(await screen.findByRole('heading', { name: 'Mis Tests' })).toBeInTheDocument()
    expect(screen.getByText('Mis tests')).toBeInTheDocument()
    expect(screen.getByText('Tests realizados')).toBeInTheDocument()
    expect(screen.getByText('Tiempo medio')).toBeInTheDocument()
    expect(screen.getByText('82,4/100')).toBeInTheDocument()
    expect(screen.getByText('Historial completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Número de tests del historial')).toHaveTextContent('3 Tests')
    expect(screen.getAllByRole('button', { name: /^realizar test$/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('cell', { name: /87 puntos · 86,7% de acierto/i })).toBeInTheDocument()
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
    expect(screen.queryByText('Por revisar')).not.toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: /no disponible/i }).length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText(/filtrar historial por estado/i), 'passed')

    expect(screen.getByText(/id 77/i)).toBeInTheDocument()
    expect(screen.queryByText(/id 78/i)).not.toBeInTheDocument()
  })

  it('permite iniciar el flujo existente desde el CTA y completar un test real', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TestsPage />)

    await user.click((await screen.findAllByRole('button', { name: /^realizar test$/i }))[0])

    expect(screen.getByRole('button', { name: /volver a mis tests/i })).toBeInTheDocument()
    expect(screen.getByText('Selecciona el permiso')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /comenzar permiso b - turismos/i }))
    await user.click(screen.getByRole('button', { name: /test aleatorio/i }))

    expect(await screen.findByText('Mapa de preguntas')).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === 'Pregunta 1 de 30')).toBeInTheDocument()
    expect(screen.getByText('0/30')).toBeInTheDocument()

    for (let questionNumber = 1; questionNumber <= 30; questionNumber += 1) {
      await user.click(screen.getByRole('button', { name: new RegExp(`B Opción B ${questionNumber}`, 'i') }))

      if (questionNumber < 30) {
        await user.click(screen.getByRole('button', { name: /siguiente/i }))
      } else {
        await user.click(screen.getAllByRole('button', { name: /finalizar test/i })[0])
      }
    }

    expect(await screen.findByRole('heading', { name: 'Test superado' })).toBeInTheDocument()
    expect(screen.getByText('Muy bien hecho, sigue así')).toBeInTheDocument()
    expect(screen.getByText('Aciertos')).toBeInTheDocument()
    expect(screen.getByText('Sin responder')).toBeInTheDocument()
    expect(screen.getByText(/Tiempo/, { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText('Mapa de preguntas')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revisar respuestas/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /revisar respuestas/i }))

    expect(await screen.findByText('Revisión de respuestas')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /volver al resultado/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /b opción b 30/i })).toBeDisabled()
  })

  it('permite finalizar un test con preguntas sin responder y revisarlas después', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TestsPage />)

    await user.click((await screen.findAllByRole('button', { name: /^realizar test$/i }))[0])
    await user.click(screen.getByRole('button', { name: /comenzar permiso b - turismos/i }))
    await user.click(screen.getByRole('button', { name: /test aleatorio/i }))

    expect(await screen.findByText('Mapa de preguntas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /B Opción B 1/i }))

    for (let questionNumber = 1; questionNumber < 30; questionNumber += 1) {
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
    }

    await user.click(screen.getAllByRole('button', { name: /finalizar test/i })[0])

    expect(await screen.findByRole('heading', { name: 'Test superado' })).toBeInTheDocument()
    expect(screen.getByText('Sin responder')).toBeInTheDocument()
    expect(screen.getByText('Fallos').closest('div')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: /revisar respuestas/i }))

    expect(await screen.findByText('Revisión de respuestas')).toBeInTheDocument()
    expect(screen.getByText(/Sin responder · no suma como fallo/i)).toBeInTheDocument()
  })

  it('renderiza las superficies principales del flujo de tests en inglés', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TestsPage />, undefined, { language: 'en' })

    expect(await screen.findByRole('heading', { name: 'My Tests' })).toBeInTheDocument()
    expect(screen.getByText('Tests taken')).toBeInTheDocument()
    expect(screen.getByLabelText('Number of tests in history')).toHaveTextContent('3 Tests')

    await user.click((await screen.findAllByRole('button', { name: /^take test$/i }))[0])

    expect(screen.getByRole('button', { name: /back to my tests/i })).toBeInTheDocument()
    expect(screen.getByText('Select permit')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start b permit - cars/i }))
    await user.click(screen.getByRole('button', { name: /random test/i }))

    expect(await screen.findByText('Question map')).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === 'Question 1 of 30')).toBeInTheDocument()
  })
})
