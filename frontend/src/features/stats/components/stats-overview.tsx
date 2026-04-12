import { Link } from 'react-router-dom'
import { ProgressTrendIcon } from '../../../components/icons'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import type { AuthUser } from '../../auth/types'
import { useStats } from '../hooks/use-stats'
import type { StatsHistoryItem } from '../types'

type StatsOverviewProps = {
  accessToken: string | null
  user?: AuthUser | null
  onStartTest?: () => void
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)}%`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getRecentTestLabel(item: StatsHistoryItem) {
  if (item.permit_code && item.topic_id) {
    return `Permiso ${item.permit_code} · Tema ${item.topic_id}`
  }

  if (item.permit_code) {
    return `Permiso ${item.permit_code}`
  }

  if (item.topic_id) {
    return `Tema ${item.topic_id}`
  }

  return 'Test general'
}

export function StatsOverview({ accessToken, user, onStartTest }: StatsOverviewProps) {
  const statsQuery = useStats(accessToken)

  if (statsQuery.isLoading) {
    return (
      <Card className="flex min-h-80 items-center justify-center gap-3 py-12">
        <Spinner className="border-[#d1dceb] border-t-[#2C5F8A]" />
        <span className="text-sm text-[#5f7287]">Cargando dashboard desde core-service…</span>
      </Card>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
        <EmptyState
          title="No pudimos cargar tu dashboard"
          description="Inténtalo de nuevo en unos segundos. El panel depende del contrato real de GET /api/v1/stats."
          action={
            <Button type="button" onClick={() => void statsQuery.refetch()}>
              Reintentar
          </Button>
        }
      />
    )
  }

  const { summary, goal, history } = statsQuery.data
  const hasHistory = history.length > 0
  const displayName = user?.full_name?.split(' ')[0] ?? 'alumno'
  const recentHistory = history.slice(0, 3)

  return (
    <div className="grid gap-6 xl:gap-7">
      <section className="grid gap-2">
        <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Resumen</p>
        <h2 className="m-0 text-[clamp(2.1rem,4vw,3.25rem)] leading-none text-[#1E3A5F]">Hola, {displayName}</h2>
        <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
          Aquí tienes una vista clara de tu rendimiento, tu racha actual y el objetivo que te separa del siguiente nivel.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatMetric accent="blue" label="Tests realizados" value={String(summary.total_tests)} />
        <StatMetric accent="navy" label="Tasa de aprobados" value={formatPercentage(summary.pass_rate_pct)} />
        <StatMetric accent="green" label="Tasa de aciertos" value={formatPercentage(summary.accuracy_pct)} />
        <StatMetric accent="green" label="Racha actual" value={`${summary.current_streak_days} días`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card as="section" className="relative flex min-h-[23rem] flex-col overflow-hidden bg-[linear-gradient(135deg,#1E3A5F_0%,#2C5F8A_100%)] text-white">
          <div className="absolute inset-y-0 right-0 hidden w-56 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_62%)] md:block" />
          <div className="relative grid h-full gap-6">
            <div>
              <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-[#dceaf7]">
                Practicar
              </span>
              <h3 className="mb-2 mt-4 text-[clamp(2rem,4vw,3rem)] leading-none">¿Listo para practicar?</h3>
              <p className="m-0 max-w-2xl text-sm text-[#dbe9f6] md:text-base">
                Elige un tipo de test y mejora tu preparación para el examen teórico
              </p>
            </div>

            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={onStartTest}
                className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-white px-5 py-3 font-semibold text-[#1E3A5F] shadow-[0_18px_30px_-22px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Realizar test →
              </button>
            </div>
          </div>
        </Card>

        <Card as="section" className="grid min-h-[23rem] gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="m-0 text-sm font-semibold text-[#2C5F8A]">Tests recientes</p>
              <h3 className="mb-2 mt-2 text-2xl text-[#1E3A5F]">Tu actividad más nueva</h3>
              <p className="m-0 text-sm text-[#5f7287]">Aquí solo se muestran los intentos más recientes para que detectes rápido si mantienes el nivel o conviene repasar.</p>
            </div>

            <Link className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#2C5F8A] transition-colors hover:text-[#1E3A5F]" to="/stats">
              Ver todo
            </Link>
          </div>

          {hasHistory ? (
            <ul className="m-0 grid gap-3 p-0">
              {recentHistory.map((item) => (
                <li key={item.test_id} className="list-none rounded-[20px] border border-[#e1e8f0] bg-[#f9fbfd] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-[#1E3A5F]">{getRecentTestLabel(item)}</strong>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.passed ? 'bg-[#e7f5ee] text-[#2E7D5B]' : 'bg-[#fff1f0] text-[#b94b4b]'
                          }`}
                        >
                          {item.passed ? 'Aprobado' : 'Requiere repaso'}
                        </span>
                      </div>
                      <p className="mb-0 mt-1 text-sm text-[#5f7287]">
                        {formatDate(item.created_at)} · {item.correct_count} correctas · {item.wrong_count} incorrectas
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="m-0 text-sm text-[#5f7287]">Precisión</p>
                      <strong className="text-xl text-[#1E3A5F]">{formatPercentage(item.accuracy_pct)}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <InlineEmptyState message="Todavía no tienes tests recientes. Empieza con uno nuevo para ver tu evolución real." />
          )}
        </Card>
      </section>

      <Card as="section" className="grid gap-5 bg-[#fdfefe]">
        <div className="flex items-start gap-4">
          <ProgressTrendIcon />
          <div>
            <h3 className="m-0 text-2xl text-[#1E3A5F]">Progreso general</h3>
            <p className="mb-0 mt-1 text-sm text-[#5f7287]">Basado en tu tasa de aciertos global</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#e7edf4]">
            <div
              aria-label="Progreso hacia el objetivo"
              className="h-full rounded-full bg-[#2E7D5B] transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(goal.progress_pct, 100))}%` }}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-sm text-[#5f7287]">
            <span className="justify-self-start">0%</span>
            <span className="text-center text-[#1E3A5F]">Objetivo: 90% para aprobar con confianza</span>
            <span className="justify-self-end">100%</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function StatMetric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'navy' | 'blue' | 'green'
}) {
  const accentClasses = {
    navy: 'bg-[#eef2f7] text-[#1E3A5F]',
    blue: 'bg-[#edf3f8] text-[#2C5F8A]',
    green: 'bg-[#e7f5ee] text-[#2E7D5B]',
  }

  return (
    <Card>
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accentClasses[accent]}`}>{label}</span>
      <strong className="mt-4 block text-3xl text-[#1E3A5F]">{value}</strong>
    </Card>
  )
}

function InlineEmptyState({ message }: { message: string }) {
  return <p className="m-0 rounded-[20px] bg-[#f7fafd] p-4 text-sm text-[#5f7287]">{message}</p>
}
