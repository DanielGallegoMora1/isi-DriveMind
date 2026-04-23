import { useMemo, useState, type ComponentType } from 'react'
import {
  Award,
  CalendarDays,
  Clock3,
  ClipboardList,
  Filter,
  Flame,
  History,
  PlayCircle,
  Target,
  Timer,
} from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { useStats, type StatsHistoryItem } from '../../stats'

type MyTestsOverviewProps = {
  accessToken: string | null
  onStartTest: () => void
}

type HistoryFilter = 'all' | 'passed' | 'failed'

type MetricCardProps = {
  title: string
  value: string
  description: string
  badge?: string
  icon: ComponentType<{ className?: string }>
  accent: string
  accentText: string
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)}%`
}

function formatScore(value: number | null) {
  if (value === null) {
    return 'Sin nota'
  }

  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)}/100`
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null || totalSeconds <= 0) {
    return 'No disponible'
  }

  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`
  }

  return `${remainingSeconds} s`
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Sin actividad'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildTestName(item: StatsHistoryItem) {
  if (item.permit_code && item.topic_id) {
    return `Tema ${item.topic_id} · Permiso ${item.permit_code}`
  }

  if (item.permit_code) {
    return `Simulacro permiso ${item.permit_code}`
  }

  return 'Test general'
}

function buildTestType(item: StatsHistoryItem) {
  if (item.topic_id) {
    return 'Por tema'
  }

  if (item.permit_code) {
    return 'Por permiso'
  }

  return 'General'
}

export function MyTestsOverview({ accessToken, onStartTest }: MyTestsOverviewProps) {
  const statsQuery = useStats(accessToken)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')

  const filteredHistory = useMemo(() => {
    const history = statsQuery.data?.history ?? []

    switch (historyFilter) {
      case 'passed':
        return history.filter((item) => item.passed)
      case 'failed':
        return history.filter((item) => !item.passed)
      default:
        return history
    }
  }, [historyFilter, statsQuery.data?.history])

  if (statsQuery.isLoading) {
    return (
      <Card className="flex min-h-80 items-center justify-center gap-3 py-12">
        <Spinner className="border-[#d1dceb] border-t-[#2C5F8A]" />
        <span className="text-sm text-[#5f7287]">Cargando tu panel de tests…</span>
      </Card>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
        <EmptyState
          title="No pudimos cargar Mis Tests"
          description="La vista depende del contrato real de estadísticas del core-service. Inténtalo de nuevo en unos segundos."
          action={
            <Button type="button" onClick={() => void statsQuery.refetch()}>
              Reintentar
          </Button>
        }
      />
    )
  }

  const { summary, history } = statsQuery.data
  const metrics: MetricCardProps[] = [
    {
      title: 'Tests realizados',
      value: String(summary.total_tests),
      description: 'Intentos registrados hasta ahora.',
      badge: `${summary.passed_tests} aprobados`,
      icon: ClipboardList,
      accent: 'bg-[#eef4ff]',
      accentText: 'text-[#315efb]',
    },
    {
      title: 'Tasa de aprobados',
      value: formatPercentage(summary.pass_rate_pct),
      description: 'Porcentaje de tests que terminan aprobados.',
      badge: `${summary.failed_tests} suspensos`,
      icon: Award,
      accent: 'bg-[#eefcf5]',
      accentText: 'text-[#1f8f61]',
    },
    {
      title: 'Tasa de aciertos',
      value: formatPercentage(summary.accuracy_pct),
      description: 'Precisión global sobre todas las preguntas.',
      badge: 'Objetivo recomendado: 90%',
      icon: Target,
      accent: 'bg-[#eef8ff]',
      accentText: 'text-[#0f7bb8]',
    },
    {
      title: 'Tiempo medio',
      value: formatDuration(summary.average_time_seconds),
      description: 'Promedio invertido por test completado.',
      icon: Clock3,
      accent: 'bg-[#fff4ea]',
      accentText: 'text-[#d97706]',
    },
    {
      title: 'Nota media',
      value: formatScore(summary.average_score),
      description: 'Puntuación media de tus envíos.',
      badge: formatPercentage(summary.accuracy_pct),
      icon: Award,
      accent: 'bg-[#f4f0ff]',
      accentText: 'text-[#7c3aed]',
    },
    {
      title: 'Racha actual / mejor',
      value: `${summary.current_streak_days} / ${summary.best_streak_days} días`,
      description: 'Constancia acumulada y mejor marca histórica.',
      icon: Flame,
      accent: 'bg-[#fff1f1]',
      accentText: 'text-[#dc2626]',
    },
    {
      title: 'Tiempo total',
      value: formatDuration(summary.total_time_seconds),
      description: 'Tiempo total registrado practicando.',
      icon: Timer,
      accent: 'bg-[#eefcfb]',
      accentText: 'text-[#0f766e]',
    },
    {
      title: 'Última actividad',
      value: summary.last_activity_at ? formatDate(summary.last_activity_at) : 'Sin actividad',
      description: 'Último momento con actividad registrada.',
      badge: formatDateTime(summary.last_activity_at),
      icon: CalendarDays,
      accent: 'bg-[#f2f4f8]',
      accentText: 'text-[#475569]',
    },
  ]

  return (
    <div className="grid gap-6 xl:gap-7">
      <section className="grid gap-3">
        <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Mis Tests</p>
        <div className="grid gap-4 rounded-[28px] border border-[#dde6ef] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(30,58,95,0.18)] md:p-8">
          <div className="grid gap-2">
            <h1 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">Mis Tests</h1>
            <h2 className="m-0 text-xl font-semibold text-[#2C5F8A]">Mis tests</h2>
            <p className="m-0 max-w-3xl text-sm leading-6 text-[#5f7287] md:text-base">
              Seguimiento real de tu progreso: cómo vas aprobando, cuánto tiempo inviertes y qué historial has acumulado para seguir practicando con criterio.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#1d4ed8_0%,#0f766e_100%)] p-0 text-white shadow-[0_24px_48px_-32px_rgba(15,118,110,0.65)]">
        <div className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-6">
          <div className="grid gap-2.5">
            <span className="inline-flex w-fit rounded-full bg-[rgba(255,255,255,0.16)] px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-white/90">
              Siguiente práctica
            </span>
            <div>
              <h3 className="m-0 text-[clamp(1.5rem,2.6vw,2rem)] leading-none">No rompas la racha</h3>
              <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
                Abre el flujo real de práctica y sigue sumando intentos para mejorar tu media y mantener el ritmo.
              </p>
            </div>
          </div>

          <div className="flex justify-start md:justify-end">
            <Button
              type="button"
              onClick={onStartTest}
              className="inline-flex items-center gap-2 bg-white !font-semibold !text-[#14324f] ring-1 ring-white/70 hover:bg-[#eef6ff] hover:!text-[#102b45]"
            >
              <PlayCircle className="size-5" />
              <span>Realizar test</span>
            </Button>
          </div>
        </div>
      </Card>

      <Card as="section" className="grid gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#315efb]">
              <History className="size-6" />
            </span>
            <div className="grid gap-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-2xl text-[#1E3A5F]">Historial completo</h3>
                <span
                  aria-label="Número de tests del historial"
                  className="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-sm font-semibold text-[#315efb]"
                >
                  {history.length} Tests
                </span>
              </div>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[#5f7287]" htmlFor="tests-history-filter">
            <span className="inline-flex items-center gap-2 text-[#1E3A5F]">
              <Filter className="size-4" />
              Filtrar historial por estado
            </span>
            <select
              id="tests-history-filter"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value as HistoryFilter)}
              className="min-h-11 rounded-2xl border border-[#dbe4ee] bg-[#f8fbfd] px-4 text-sm text-[#1E3A5F] outline-none transition-colors focus:border-[#2C5F8A]"
            >
              <option value="all">Todos</option>
              <option value="passed">Aprobados</option>
              <option value="failed">Suspensos</option>
            </select>
          </label>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="Todavía no hay historial"
            description="Cuando completes tu primer test, aquí verás el detalle completo de tus resultados."
            action={
              <Button type="button" onClick={onStartTest}>
                Realizar test
              </Button>
            }
          />
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#d9e3ee] bg-[#f8fbfd] p-6 text-sm text-[#5f7287]">
            No hay tests para el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[22px] border border-[#e1e8f0]">
            <table className="min-w-full border-collapse bg-white text-left">
              <thead className="bg-[#f8fbfd] text-sm text-[#5f7287]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Nombre del test</th>
                  <th className="px-4 py-3 font-semibold">Tipo de test</th>
                  <th className="px-4 py-3 font-semibold">Resultado</th>
                  <th className="px-4 py-3 font-semibold">Tiempo empleado</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.test_id} className="border-t border-[#edf2f7] transition-colors hover:bg-[#f9fbfd]">
                    <td className="px-4 py-4 text-sm font-medium text-[#1E3A5F]">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4 text-sm text-[#1E3A5F]">
                      <div className="grid gap-1">
                        <strong>{buildTestName(item)}</strong>
                        <span className="text-xs text-[#5f7287]">ID {item.test_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#5f7287]">{buildTestType(item)}</td>
                    <td className="px-4 py-4 text-sm text-[#1E3A5F]">
                      {item.score !== null ? `${item.score} puntos · ${formatPercentage(item.accuracy_pct)} de acierto` : formatPercentage(item.accuracy_pct)}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#5f7287]">{formatDuration(item.duration_seconds)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.passed ? 'bg-[#e8f8ef] text-[#1f8f61]' : 'bg-[#fff1f1] text-[#dc2626]'
                        }`}
                      >
                        {item.passed ? 'Aprobado' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button type="button" variant="secondary" className="min-h-10 px-4 py-2 text-sm" onClick={onStartTest}>
                        Realizar test
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricCard({ title, value, description, badge, icon: Icon, accent, accentText }: MetricCardProps) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${accent} ${accentText}`}>
          <Icon className="size-6" />
        </span>
        {badge ? <span className="rounded-full bg-[#f5f8fb] px-3 py-1 text-xs font-semibold text-[#5f7287]">{badge}</span> : null}
      </div>

      <div className="grid gap-1.5">
        <p className="m-0 text-sm font-semibold text-[#2C5F8A]">{title}</p>
        <strong className="text-[1.85rem] leading-none text-[#1E3A5F]">{value}</strong>
        <p className="m-0 text-sm leading-6 text-[#5f7287]">{description}</p>
      </div>
    </Card>
  )
}
