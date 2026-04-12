import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { HomePage } from './home-page'
import { renderWithProviders } from '../test/utils'

describe('HomePage', () => {
  it('mantiene el dashboard como estado inicial y conecta el flujo de test hasta el examen real', async () => {
    const user = userEvent.setup()

    renderWithProviders(<HomePage />)

    expect(await screen.findByText('Hola, Estudiante')).toBeInTheDocument()
    expect(screen.getByText('Tests realizados')).toBeInTheDocument()
    expect(screen.getByText('Tasa de aprobados')).toBeInTheDocument()
    expect(screen.getByText('¿Listo para practicar?')).toBeInTheDocument()
    expect(screen.getByText('Elige un tipo de test y mejora tu preparación para el examen teórico')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todo' })).toBeInTheDocument()
    expect(screen.getByText('Progreso general')).toBeInTheDocument()
    expect(screen.getByText('Basado en tu tasa de aciertos global')).toBeInTheDocument()
    expect(screen.getByText(/Tu actividad más nueva/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Objetivo: 90% para aprobar con confianza')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByText('Margen restante')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /realizar test/i }))

    expect(screen.getByRole('button', { name: /volver al dashboard/i })).toBeInTheDocument()
    expect(screen.getByText('Selecciona el permiso')).toBeInTheDocument()
    expect(screen.getByText('Elige el tipo de permiso sobre el que quieres realizar el test')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comenzar permiso b - turismos/i })).toBeInTheDocument()
    expect(screen.queryByText('¿Listo para practicar?')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /comenzar permiso b/i }))

    expect(screen.getByRole('button', { name: /cambiar permiso/i })).toBeInTheDocument()
    expect(screen.getByText('¿Qué tipo de test quieres hacer?')).toBeInTheDocument()
    expect(screen.getByText('Elige entre las siguientes opciones para practicar')).toBeInTheDocument()
    expect(screen.getByText('Test por temas')).toBeInTheDocument()
    expect(screen.getByText('Test aleatorio')).toBeInTheDocument()
    expect(screen.getByText('Preguntas falladas')).toBeInTheDocument()
    expect(screen.queryByText('Elegí el tema para empezar el test')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /test por temas/i }))

    expect(screen.getByText('Elegí el tema para empezar el test')).toBeInTheDocument()
    expect(screen.getByText('Tema 1')).toBeInTheDocument()
    expect(screen.getByText('Señales')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /señales/i }))

    expect(await screen.findByText('Mapa de preguntas')).toBeInTheDocument()
    expect(screen.getByText('Mapa de preguntas')).toBeInTheDocument()
    expect(screen.getAllByText('Tema 1. Señales').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /volver a tipos de test/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /volver a tipos de test/i }))
    expect(screen.getByText('¿Qué tipo de test quieres hacer?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /test aleatorio/i }))

    expect(await screen.findByText('Mapa de preguntas')).toBeInTheDocument()
    expect(screen.getByText('Test aleatorio')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cambiar permiso/i }))
    expect(screen.getByText('Selecciona el permiso')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /volver al dashboard/i }))
    expect(screen.getByText('¿Listo para practicar?')).toBeInTheDocument()
  })
})
