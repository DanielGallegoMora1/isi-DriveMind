import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/utils'
import { HelpCenterPage } from './help-center-page'

describe('HelpCenterPage', () => {
  it('renders the bilingual top section and keeps answers collapsed by default in English', () => {
    renderWithProviders(<HelpCenterPage />, undefined, { language: 'en' })

    expect(screen.getByRole('heading', { name: 'Help center' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to settings' })).toBeInTheDocument()
    expect(screen.getByText('Have questions? Here you will find answers to the most common ones.')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search help' })).toHaveAttribute('placeholder', 'Search help...')
    expect(screen.getByRole('button', { name: /All/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Account and profile/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tests and exams/ })).toBeInTheDocument()

    const questionButton = screen.getByRole('button', { name: 'How do I change my password?' })

    expect(questionButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/You can change your password from Settings/)).not.toBeInTheDocument()
  })

  it('filters by visible category without losing the search term', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HelpCenterPage />)

    await user.click(screen.getByRole('button', { name: /Tests y exámenes/ }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en la ayuda' }), 'falladas')

    expect(screen.getByRole('button', { name: '¿Qué es el test de preguntas falladas?' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '¿Cómo cambio mi contraseña?' })).not.toBeInTheDocument()
    expect(screen.getByText('Resultados visibles')).toBeInTheDocument()
    expect(screen.getByText('Preguntas totales')).toBeInTheDocument()
  })

  it('expands a question to show the answer in English', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HelpCenterPage />, undefined, { language: 'en' })

    const questionButton = screen.getByRole('button', { name: 'How do the tests work?' })

    expect(questionButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(questionButton)

    expect(questionButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Tests simulate the official theory exam. Each test contains a fixed number of questions and you can only make a limited number of mistakes to pass.')).toBeInTheDocument()
  })

  it('search keeps showing results from non-visible categories when applicable', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HelpCenterPage />, undefined, { language: 'en' })

    await user.type(screen.getByRole('searchbox', { name: 'Search help' }), 'streak')

    expect(screen.getByText('Progress and statistics')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What is my test streak?' })).toBeInTheDocument()
    expect(screen.getByText('Search also shows results from other help center sections.')).toBeInTheDocument()
  })
})
