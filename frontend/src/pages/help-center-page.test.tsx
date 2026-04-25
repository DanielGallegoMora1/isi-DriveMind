import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/utils'
import { HelpCenterPage } from './help-center-page'

describe('HelpCenterPage', () => {
  it('renderiza el contenido FAQ exacto por categorías', () => {
    renderWithProviders(<HelpCenterPage />)

    expect(screen.getByRole('heading', { name: 'Centro de ayuda' })).toBeInTheDocument()
    expect(screen.getAllByText('Cuenta y perfil')).toHaveLength(2)
    expect(screen.getAllByText('Tests y exámenes')).toHaveLength(2)
    expect(screen.getAllByText('Estadísticas y progreso')).toHaveLength(2)
    expect(screen.getAllByText('Configuración')).toHaveLength(2)
    expect(screen.getAllByText('Problemas técnicos')).toHaveLength(2)
    expect(screen.getAllByText('Pagos y suscripciones')).toHaveLength(2)
    expect(screen.getByText('¿Cómo cambio mi contraseña?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Puedes cambiar tu contraseña desde Ajustes > Seguridad y privacidad > Cambiar contraseña. Introduce tu contraseña actual y la nueva, y guarda los cambios.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('La aplicación se cierra inesperadamente')).toBeInTheDocument()
  })

  it('filtra por categoría sin perder la búsqueda', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HelpCenterPage />)

    await user.click(screen.getByRole('button', { name: 'Configuración' }))

    expect(screen.getByText('¿Puedo cambiar el idioma de la aplicación?')).toBeInTheDocument()
    expect(screen.queryByText('¿Cómo funcionan los tests?')).not.toBeInTheDocument()
    expect(screen.getByText('Resultados visibles')).toBeInTheDocument()
    expect(screen.getByText('Preguntas totales')).toBeInTheDocument()
  })

  it('busca preguntas y respuestas en todo el contenido cargado', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HelpCenterPage />)

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el Centro de ayuda' }), 'reembolsos')

    expect(screen.getByText('¿Ofrecen reembolsos?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Los reembolsos dependen de las condiciones del servicio. Consulta la política correspondiente o contacta con soporte.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('¿Cómo cambio mi contraseña?')).not.toBeInTheDocument()
  })
})
