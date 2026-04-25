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
import { useI18n } from '../../i18n'
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

function formatPercentage(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

function formatScore(value: number | null, locale: string, language: 'es' | 'en') {
  if (value === null) {
    return language === 'en' ? 'No score' : 'Sin nota'
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}/100`
}

function formatDuration(totalSeconds: number | null | undefined, language: 'es' | 'en') {
  if (totalSeconds == null || totalSeconds <= 0) {
    return language === 'en' ? 'Not available' : 'No disponible'
  }

  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return language === 'en' ? `${hours} h ${minutes} min` : `${hours} h ${minutes} min`
  }

  if (minutes > 0) {
     return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`
  }

  return `${remainingSeconds} s`
}

function formatDateTime(value: string | null, locale: string, language: 'es' | 'en') {
  if (!value) {
    return language === 'en' ? 'No activity' : 'Sin actividad'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildTestName(item: StatsHistoryItem, language: 'es' | 'en') {
  if (item.permit_code && item.topic_id) {
    return language === 'en'
      ? `Topic ${item.topic_id} · Permit ${item.permit_code}`
      : `Tema ${item.topic_id} · Permiso ${item.permit_code}`
  }

  if (item.permit_code) {
    return language === 'en' ? `Permit ${item.permit_code} mock exam` : `Simulacro permiso ${item.permit_code}`
  }

  return language === 'en' ? 'General test' : 'Test general'
}

function buildTestType(item: StatsHistoryItem, language: 'es' | 'en') {
  if (item.topic_id) {
    return language === 'en' ? 'By topic' : 'Por tema'
  }

  if (item.permit_code) {
    return language === 'en' ? 'By permit' : 'Por permiso'
  }

  return language === 'en' ? 'General' : 'General'
}

export function MyTestsOverview({ accessToken, onStartTest }: MyTestsOverviewProps) {
  const statsQuery = useStats(accessToken)
  const { language, locale } = useI18n()
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const copy = language === 'en'
    ? {
        loading: 'Loading your tests dashboard…',
        errorTitle: 'We could not load My Tests',
        errorDescription: 'This view depends on the real statistics contract from core-service. Try again in a few seconds.',
        retry: 'Retry',
        title: 'My Tests',
        subtitle: 'My tests',
        intro: 'A real view of your progress: how often you pass, how much time you spend, and the history you have built to keep practicing with purpose.',
        totalTests: 'Tests taken',
        attempts: 'Attempts recorded so far.',
        passedBadge: (value: number) => `${value} passed`,
        passRate: 'Pass rate',
        passDescription: 'Percentage of tests that end in a pass.',
        failedBadge: (value: number) => `${value} failed`,
        accuracyRate: 'Accuracy rate',
        accuracyDescription: 'Overall precision across all questions.',
        accuracyBadge: 'Recommended goal: 90%',
        averageTime: 'Average time',
        averageTimeDescription: 'Average time spent per completed test.',
        averageScore: 'Average score',
        averageScoreDescription: 'Average score across your submissions.',
        streak: 'Current / best streak',
        streakDescription: 'Consistency accumulated and best historical mark.',
        totalTime: 'Total time',
        totalTimeDescription: 'Total recorded time spent practicing.',
        lastActivity: 'Last activity',
        lastActivityDescription: 'Latest time with recorded activity.',
        nextPractice: 'Next practice',
        keepStreak: 'Do not break the streak',
        keepStreakDescription: 'Open the real practice flow and keep adding attempts to improve your average and maintain the pace.',
        startTest: 'Take test',
        fullHistory: 'Full history',
        historyCount: (value: number) => `${value} Tests`,
        filterLabel: 'Filter history by status',
        all: 'All',
        passed: 'Passed',
        failed: 'Failed',
        noHistoryTitle: 'There is no history yet',
        noHistoryDescription: 'When you complete your first test, you will see the full detail of your results here.',
        noFilterResults: 'There are no tests for the selected filter.',
        date: 'Date',
        testName: 'Test name',
        testType: 'Test type',
        result: 'Result',
        timeSpent: 'Time spent',
        status: 'Status',
        action: 'Action',
        id: 'ID',
        pointsAndAccuracy: (score: number, accuracy: number) => `${score} points · ${formatPercentage(accuracy, locale)} accuracy`,
        failStatus: 'Failed',
        notAvailable: 'Not available',
      }
    : {
        loading: 'Cargando tu panel de tests…',
        errorTitle: 'No pudimos cargar Mis Tests',
        errorDescription: 'La vista depende del contrato real de estadísticas del core-service. Inténtalo de nuevo en unos segundos.',
        retry: 'Reintentar',
        title: 'Mis Tests',
        subtitle: 'Mis tests',
        intro: 'Seguimiento real de tu progreso: cómo vas aprobando, cuánto tiempo inviertes y qué historial has acumulado para seguir practicando con criterio.',
        totalTests: 'Tests realizados',
        attempts: 'Intentos registrados hasta ahora.',
        passedBadge: (value: number) => `${value} aprobados`,
        passRate: 'Tasa de aprobados',
        passDescription: 'Porcentaje de tests que terminan aprobados.',
        failedBadge: (value: number) => `${value} suspensos`,
        accuracyRate: 'Tasa de aciertos',
        accuracyDescription: 'Precisión global sobre todas las preguntas.',
        accuracyBadge: 'Objetivo recomendado: 90%',
        averageTime: 'Tiempo medio',
        averageTimeDescription: 'Promedio invertido por test completado.',
        averageScore: 'Nota media',
        averageScoreDescription: 'Puntuación media de tus envíos.',
        streak: 'Racha actual / mejor',
        streakDescription: 'Constancia acumulada y mejor marca histórica.',
        totalTime: 'Tiempo total',
        totalTimeDescription: 'Tiempo total registrado practicando.',
        lastActivity: 'Última actividad',
        lastActivityDescription: 'Último momento con actividad registrada.',
        nextPractice: 'Siguiente práctica',
        keepStreak: 'No rompas la racha',
        keepStreakDescription: 'Abre el flujo real de práctica y sigue sumando intentos para mejorar tu media y mantener el ritmo.',
        startTest: 'Realizar test',
        fullHistory: 'Historial completo',
        historyCount: (value: number) => `${value} Tests`,
        filterLabel: 'Filtrar historial por estado',
        all: 'Todos',
        passed: 'Aprobado',
        failed: 'Suspenso',
        noHistoryTitle: 'Todavía no hay historial',
        noHistoryDescription: 'Cuando completes tu primer test, aquí verás el detalle completo de tus resultados.',
        noFilterResults: 'No hay tests para el filtro seleccionado.',
        date: 'Fecha',
        testName: 'Nombre del test',
        testType: 'Tipo de test',
        result: 'Resultado',
        timeSpent: 'Tiempo empleado',
        status: 'Estado',
        action: 'Acción',
        id: 'ID',
        pointsAndAccuracy: (score: number, accuracy: number) => `${score} puntos · ${formatPercentage(accuracy, locale)} de acierto`,
        failStatus: 'Suspenso',
        notAvailable: 'No disponible',
      }

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
        <span className="text-sm text-[#5f7287]">{copy.loading}</span>
      </Card>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
        <EmptyState
          title={copy.errorTitle}
          description={copy.errorDescription}
          action={
            <Button type="button" onClick={() => void statsQuery.refetch()}>
              {copy.retry}
          </Button>
        }
      />
    )
  }

  const { summary, history } = statsQuery.data
  const metrics: MetricCardProps[] = [
    {
       title: copy.totalTests,
       value: String(summary.total_tests),
       description: copy.attempts,
       badge: copy.passedBadge(summary.passed_tests),
      icon: ClipboardList,
      accent: 'bg-[#eef4ff]',
      accentText: 'text-[#315efb]',
    },
    {
       title: copy.passRate,
       value: formatPercentage(summary.pass_rate_pct, locale),
       description: copy.passDescription,
       badge: copy.failedBadge(summary.failed_tests),
      icon: Award,
      accent: 'bg-[#eefcf5]',
      accentText: 'text-[#1f8f61]',
    },
    {
       title: copy.accuracyRate,
       value: formatPercentage(summary.accuracy_pct, locale),
       description: copy.accuracyDescription,
       badge: copy.accuracyBadge,
      icon: Target,
      accent: 'bg-[#eef8ff]',
      accentText: 'text-[#0f7bb8]',
    },
    {
       title: copy.averageTime,
       value: formatDuration(summary.average_time_seconds, language),
       description: copy.averageTimeDescription,
      icon: Clock3,
      accent: 'bg-[#fff4ea]',
      accentText: 'text-[#d97706]',
    },
    {
       title: copy.averageScore,
       value: formatScore(summary.average_score, locale, language),
       description: copy.averageScoreDescription,
       badge: formatPercentage(summary.accuracy_pct, locale),
      icon: Award,
      accent: 'bg-[#f4f0ff]',
      accentText: 'text-[#7c3aed]',
    },
    {
       title: copy.streak,
       value: `${summary.current_streak_days} / ${summary.best_streak_days} ${language === 'en' ? 'days' : 'días'}`,
       description: copy.streakDescription,
      icon: Flame,
      accent: 'bg-[#fff1f1]',
      accentText: 'text-[#dc2626]',
    },
    {
       title: copy.totalTime,
       value: formatDuration(summary.total_time_seconds, language),
       description: copy.totalTimeDescription,
      icon: Timer,
      accent: 'bg-[#eefcfb]',
      accentText: 'text-[#0f766e]',
    },
    {
       title: copy.lastActivity,
       value: summary.last_activity_at ? formatDate(summary.last_activity_at, locale) : (language === 'en' ? 'No activity' : 'Sin actividad'),
       description: copy.lastActivityDescription,
       badge: formatDateTime(summary.last_activity_at, locale, language),
      icon: CalendarDays,
      accent: 'bg-[#f2f4f8]',
      accentText: 'text-[#475569]',
    },
  ]

  return (
    <div className="grid gap-6 xl:gap-7">
      <section className="grid gap-3">
        <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.title}</p>
        <div className="grid gap-4 rounded-[28px] border border-[#dde6ef] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(30,58,95,0.18)] md:p-8">
          <div className="grid gap-2">
            <h1 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">{copy.title}</h1>
            <h2 className="m-0 text-xl font-semibold text-[#2C5F8A]">{copy.subtitle}</h2>
            <p className="m-0 max-w-3xl text-sm leading-6 text-[#5f7287] md:text-base">
              {copy.intro}
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
               {copy.nextPractice}
            </span>
            <div>
               <h3 className="m-0 text-[clamp(1.5rem,2.6vw,2rem)] leading-none">{copy.keepStreak}</h3>
               <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
                 {copy.keepStreakDescription}
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
               <span>{copy.startTest}</span>
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
                 <h3 className="m-0 text-2xl text-[#1E3A5F]">{copy.fullHistory}</h3>
                <span
                  aria-label={language === 'en' ? 'Number of tests in history' : 'Número de tests del historial'}
                  className="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-sm font-semibold text-[#315efb]"
                >
                   {copy.historyCount(history.length)}
                </span>
              </div>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[#5f7287]" htmlFor="tests-history-filter">
            <span className="inline-flex items-center gap-2 text-[#1E3A5F]">
              <Filter className="size-4" />
               {copy.filterLabel}
            </span>
            <select
              id="tests-history-filter"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value as HistoryFilter)}
              className="min-h-11 rounded-2xl border border-[#dbe4ee] bg-[#f8fbfd] px-4 text-sm text-[#1E3A5F] outline-none transition-colors focus:border-[#2C5F8A]"
            >
               <option value="all">{copy.all}</option>
               <option value="passed">{language === 'en' ? 'Passed' : 'Aprobados'}</option>
               <option value="failed">{language === 'en' ? 'Failed' : 'Suspensos'}</option>
            </select>
          </label>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title={copy.noHistoryTitle}
            description={copy.noHistoryDescription}
            action={
              <Button type="button" onClick={onStartTest}>
                {copy.startTest}
              </Button>
            }
          />
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#d9e3ee] bg-[#f8fbfd] p-6 text-sm text-[#5f7287]">
            {copy.noFilterResults}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[22px] border border-[#e1e8f0]">
            <table className="min-w-full border-collapse bg-white text-left">
              <thead className="bg-[#f8fbfd] text-sm text-[#5f7287]">
                <tr>
                   <th className="px-4 py-3 font-semibold">{copy.date}</th>
                   <th className="px-4 py-3 font-semibold">{copy.testName}</th>
                   <th className="px-4 py-3 font-semibold">{copy.testType}</th>
                   <th className="px-4 py-3 font-semibold">{copy.result}</th>
                   <th className="px-4 py-3 font-semibold">{copy.timeSpent}</th>
                   <th className="px-4 py-3 font-semibold">{copy.status}</th>
                   <th className="px-4 py-3 font-semibold text-right">{copy.action}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.test_id} className="border-t border-[#edf2f7] transition-colors hover:bg-[#f9fbfd]">
                     <td className="px-4 py-4 text-sm font-medium text-[#1E3A5F]">{formatDate(item.created_at, locale)}</td>
                    <td className="px-4 py-4 text-sm text-[#1E3A5F]">
                      <div className="grid gap-1">
                         <strong>{buildTestName(item, language)}</strong>
                         <span className="text-xs text-[#5f7287]">{copy.id} {item.test_id}</span>
                       </div>
                     </td>
                     <td className="px-4 py-4 text-sm text-[#5f7287]">{buildTestType(item, language)}</td>
                     <td className="px-4 py-4 text-sm text-[#1E3A5F]">
                       {item.score !== null ? copy.pointsAndAccuracy(item.score, item.accuracy_pct) : formatPercentage(item.accuracy_pct, locale)}
                     </td>
                     <td className="px-4 py-4 text-sm text-[#5f7287]">{formatDuration(item.duration_seconds, language)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.passed ? 'bg-[#e8f8ef] text-[#1f8f61]' : 'bg-[#fff1f1] text-[#dc2626]'
                        }`}
                      >
                         {item.passed ? copy.passed : copy.failStatus}
                       </span>
                     </td>
                     <td className="px-4 py-4 text-right">
                       <Button type="button" variant="secondary" className="min-h-10 px-4 py-2 text-sm" onClick={onStartTest}>
                         {copy.startTest}
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
