import { Link } from 'react-router-dom'
import { ProgressTrendIcon } from '../../../components/icons'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import type { AuthUser } from '../../auth/types'
import { useI18n } from '../../i18n'
import { useStats } from '../hooks/use-stats'
import { parseStatsDate } from '../lib/stats-date'
import type { StatsHistoryItem } from '../types'

type StatsOverviewProps = {
  accessToken: string | null
  user?: AuthUser | null
  onStartTest?: () => void
}

function formatPercentage(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseStatsDate(value))
}

function getRecentTestLabel(item: StatsHistoryItem, language: 'es' | 'en') {
  if (item.permit_code && item.topic_id) {
    return language === 'en'
      ? `Permit ${item.permit_code} · Topic ${item.topic_id}`
      : `Permiso ${item.permit_code} · Tema ${item.topic_id}`
  }

  if (item.permit_code) {
    return language === 'en' ? `Permit ${item.permit_code}` : `Permiso ${item.permit_code}`
  }

  if (item.topic_id) {
    return language === 'en' ? `Topic ${item.topic_id}` : `Tema ${item.topic_id}`
  }

  return language === 'en' ? 'General test' : 'Test general'
}

export function StatsOverview({ accessToken, user, onStartTest }: StatsOverviewProps) {
  const statsQuery = useStats(accessToken)
  const { language, locale } = useI18n()
  const copy = language === 'en'
    ? {
        loading: 'Loading dashboard from core-service…',
        errorTitle: 'We could not load your dashboard',
        errorDescription: 'Try again in a few seconds. This panel depends on the real GET /api/v1/stats contract.',
        retry: 'Retry',
        summary: 'Summary',
        greeting: 'Hi',
        intro: 'Here is a clear view of your performance, current streak, and the goal between you and the next level.',
        totalTests: 'Tests taken',
        passRate: 'Pass rate',
        accuracyRate: 'Accuracy rate',
        streak: 'Current streak',
        days: 'days',
        practice: 'Practice',
        ready: 'Ready to practice?',
        practiceDescription: 'Choose a test type and improve your preparation for the theory exam',
        startTest: 'Take test ->',
        recentTests: 'Recent tests',
        latestActivity: 'Your latest activity',
        recentDescription: 'Only your most recent attempts are shown here so you can quickly spot whether you are keeping the level or should review.',
        viewAll: 'View all',
        passed: 'Passed',
        reviewNeeded: 'Needs review',
        correct: 'correct',
        incorrect: 'incorrect',
        precision: 'Accuracy',
        empty: 'You do not have recent tests yet. Start a new one to see your real progress.',
        overallProgress: 'Overall progress',
        basedOnAccuracy: 'Based on your global accuracy rate',
        objective: 'Goal: 90% to pass with confidence',
        studentFallback: 'student',
      }
    : {
        loading: 'Cargando dashboard desde core-service…',
        errorTitle: 'No pudimos cargar tu dashboard',
        errorDescription: 'Inténtalo de nuevo en unos segundos. El panel depende del contrato real de GET /api/v1/stats.',
        retry: 'Reintentar',
        summary: 'Resumen',
        greeting: 'Hola',
        intro: 'Aquí tienes una vista clara de tu rendimiento, tu racha actual y el objetivo que te separa del siguiente nivel.',
        totalTests: 'Tests realizados',
        passRate: 'Tasa de aprobados',
        accuracyRate: 'Tasa de aciertos',
        streak: 'Racha actual',
        days: 'días',
        practice: 'Practicar',
        ready: '¿Listo para practicar?',
        practiceDescription: 'Elige un tipo de test y mejora tu preparación para el examen teórico',
        startTest: 'Realizar test →',
        recentTests: 'Tests recientes',
        latestActivity: 'Tu actividad más nueva',
        recentDescription: 'Aquí solo se muestran los intentos más recientes para que detectes rápido si mantienes el nivel o conviene repasar.',
        viewAll: 'Ver todo',
        passed: 'Aprobado',
        reviewNeeded: 'Requiere repaso',
        correct: 'correctas',
        incorrect: 'incorrectas',
        precision: 'Precisión',
        empty: 'Todavía no tienes tests recientes. Empieza con uno nuevo para ver tu evolución real.',
        overallProgress: 'Progreso general',
        basedOnAccuracy: 'Basado en tu tasa de aciertos global',
        objective: 'Objetivo: 90% para aprobar con confianza',
        studentFallback: 'alumno',
      }

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

  const { summary, goal, history } = statsQuery.data
  const hasHistory = history.length > 0
  const displayName = user?.full_name?.split(' ')[0] ?? copy.studentFallback
  const recentHistory = history.slice(0, 3)

  return (
    <div className="grid gap-6 xl:gap-7">
      <section className="grid gap-2">
         <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.summary}</p>
         <h2 className="m-0 text-[clamp(2.1rem,4vw,3.25rem)] leading-none text-[#1E3A5F]">{copy.greeting}, {displayName}</h2>
         <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
           {copy.intro}
         </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
         <StatMetric accent="blue" label={copy.totalTests} value={String(summary.total_tests)} />
         <StatMetric accent="navy" label={copy.passRate} value={formatPercentage(summary.pass_rate_pct, locale)} />
         <StatMetric accent="green" label={copy.accuracyRate} value={formatPercentage(summary.accuracy_pct, locale)} />
         <StatMetric accent="green" label={copy.streak} value={`${summary.current_streak_days} ${copy.days}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card as="section" className="relative flex min-h-[23rem] flex-col overflow-hidden bg-[linear-gradient(135deg,#1E3A5F_0%,#2C5F8A_100%)] text-white">
          <div className="absolute inset-y-0 right-0 hidden w-56 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_62%)] md:block" />
          <div className="relative grid h-full gap-6">
            <div>
              <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-[#dceaf7]">
                 {copy.practice}
               </span>
               <h3 className="mb-2 mt-4 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.ready}</h3>
               <p className="m-0 max-w-2xl text-sm text-[#dbe9f6] md:text-base">
                 {copy.practiceDescription}
               </p>
            </div>

            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={onStartTest}
                className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-white px-5 py-3 font-semibold text-[#1E3A5F] shadow-[0_18px_30px_-22px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                 {copy.startTest}
               </button>
            </div>
          </div>
        </Card>

        <Card as="section" className="grid min-h-[23rem] gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
               <p className="m-0 text-sm font-semibold text-[#2C5F8A]">{copy.recentTests}</p>
               <h3 className="mb-2 mt-2 text-2xl text-[#1E3A5F]">{copy.latestActivity}</h3>
               <p className="m-0 text-sm text-[#5f7287]">{copy.recentDescription}</p>
             </div>

             <Link className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#2C5F8A] transition-colors hover:text-[#1E3A5F]" to="/tests">
               {copy.viewAll}
             </Link>
          </div>

          {hasHistory ? (
            <ul className="m-0 grid gap-3 p-0">
              {recentHistory.map((item) => (
                <li key={item.test_id} className="list-none rounded-[20px] border border-[#e1e8f0] bg-[#f9fbfd] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                         <strong className="text-[#1E3A5F]">{getRecentTestLabel(item, language)}</strong>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.passed ? 'bg-[#e7f5ee] text-[#2E7D5B]' : 'bg-[#fff1f0] text-[#b94b4b]'
                          }`}
                        >
                          {item.passed ? copy.passed : copy.reviewNeeded}
                        </span>
                      </div>
                      <p className="mb-0 mt-1 text-sm text-[#5f7287]">
                         {formatDate(item.created_at, locale)} · {item.correct_count} {copy.correct} · {item.wrong_count} {copy.incorrect}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                       <p className="m-0 text-sm text-[#5f7287]">{copy.precision}</p>
                       <strong className="text-xl text-[#1E3A5F]">{formatPercentage(item.accuracy_pct, locale)}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <InlineEmptyState message={copy.empty} />
          )}
        </Card>
      </section>

      <Card as="section" className="grid gap-5 bg-[#fdfefe]">
        <div className="flex items-start gap-4">
          <ProgressTrendIcon />
          <div>
             <h3 className="m-0 text-2xl text-[#1E3A5F]">{copy.overallProgress}</h3>
             <p className="mb-0 mt-1 text-sm text-[#5f7287]">{copy.basedOnAccuracy}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#e7edf4]">
            <div
              aria-label={language === 'en' ? 'Progress toward the goal' : 'Progreso hacia el objetivo'}
              className="h-full rounded-full bg-[#2E7D5B] transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(goal.progress_pct, 100))}%` }}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-sm text-[#5f7287]">
            <span className="justify-self-start">0%</span>
             <span className="text-center text-[#1E3A5F]">{copy.objective}</span>
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
