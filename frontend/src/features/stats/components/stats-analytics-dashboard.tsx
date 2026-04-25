import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { useI18n } from '../../i18n'
import { useStats } from '../hooks/use-stats'
import { parseStatsDate } from '../lib/stats-date'
import type {
  AccuracyTrendInsight,
  StatsByTopic,
  StatsHistoryItem,
  StatsResponse,
  StatsTrendItem,
  TestTypeDistributionItem,
  TopicInsight,
  WeeklyActivityItem,
} from '../types'

type StatsAnalyticsDashboardProps = {
  accessToken: string | null
}

const trendPalette = {
  accuracy: '#2453d0',
  passRate: '#2e7d5b',
}

const distributionPalette = ['#2453d0', '#2e7d5b', '#f3a83b', '#8b5cf6', '#ef6b5a']

const testTypeLabelsEs: Record<string, string> = {
  PERMIT: 'Por permiso',
  TOPIC: 'Por tema',
  RANDOM: 'Aleatorio',
  FAILED: 'Preguntas falladas',
}

const testTypeLabelsEn: Record<string, string> = {
  PERMIT: 'By permit',
  TOPIC: 'By topic',
  RANDOM: 'Random',
  FAILED: 'Failed questions',
}

export function StatsAnalyticsDashboard({ accessToken }: StatsAnalyticsDashboardProps) {
  const statsQuery = useStats(accessToken)
  const { language, locale } = useI18n()
  const copy = language === 'en'
    ? {
        noSession: 'No active session',
        noSessionDescription: 'Sign in to load your personal statistics.',
        loading: 'Loading statistics…',
        errorTitle: 'We could not load your statistics',
        errorDescription: 'Try again in a few seconds. This dashboard depends on the real GET /api/v1/stats contract.',
        eyebrow: 'Performance analysis',
        title: 'Statistics',
        intro: 'Review how your results evolve, which test type you use most often, and where it makes sense to reinforce your study.',
        totalTests: 'Tests taken',
        averageAccuracy: 'Average accuracy',
        passed: 'Passed',
        strongestPoint: 'Strong point',
        improvementArea: 'Improvement area',
        trend: 'Trend',
      }
    : {
        noSession: 'Sin sesión activa',
        noSessionDescription: 'Inicia sesión para cargar tus estadísticas personales.',
        loading: 'Cargando estadísticas…',
        errorTitle: 'No hemos podido cargar tus estadísticas',
        errorDescription: 'Vuelve a intentarlo en unos segundos. Este panel depende del contrato real de GET /api/v1/stats.',
        eyebrow: 'Análisis de rendimiento',
        title: 'Estadísticas',
        intro: 'Revisa cómo evolucionan tus resultados, qué tipo de test haces con más frecuencia y dónde conviene reforzar el estudio.',
        totalTests: 'Tests realizados',
        averageAccuracy: 'Aciertos medios',
        passed: 'Aprobados',
        strongestPoint: 'Punto fuerte',
        improvementArea: 'Área de mejora',
        trend: 'Tendencia',
      }

  if (!accessToken) {
    return <EmptyState title={copy.noSession} description={copy.noSessionDescription} />
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
      />
    )
  }

  const data = normalizeStats(statsQuery.data)
  const strongestTopic = data.insights.strongest_topic ?? inferStrongestTopic(data.by_topic)
  const improvementArea = data.insights.improvement_area ?? inferImprovementArea(data.by_topic)
  const trendInsight = data.insights.trend ?? inferTrendInsight(data.trend)
  const chartSeries = buildTrendSeries(data.trend, data.history)
  const periodLabel = buildPeriodLabel(data.trend, data.weekly_activity, language, locale)

  return (
    <section className="grid gap-6 text-[#1E3A5F]">
      <header className="grid gap-4 rounded-[28px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.96))] p-6 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:p-8">
        <div className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.16em] uppercase text-[#2C5F8A]">{copy.eyebrow}</p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
            {copy.intro}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <HeaderMetric label={copy.totalTests} value={String(data.summary.total_tests)} />
          <HeaderMetric label={copy.averageAccuracy} value={formatPercentage(data.summary.accuracy_pct, locale)} />
          <HeaderMetric label={copy.passed} value={formatPercentage(data.summary.pass_rate_pct, locale)} />
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <TrendCard series={chartSeries} subtitle={periodLabel} />
        <DistributionCard items={data.test_type_distribution} totalTests={data.summary.total_tests} />
      </section>

      <ByTopicCard topics={data.by_topic} />

      <WeeklyActivityCard items={data.weekly_activity} />

      <section className="grid gap-4 xl:grid-cols-3">
        <InsightCard
          icon={<CheckCircle2 className="size-5" />}
            title={copy.strongestPoint}
            variant="strong"
            description={buildStrongestTopicCopy(strongestTopic, language, locale)}
          />
        <InsightCard
          icon={<AlertCircle className="size-5" />}
            title={copy.improvementArea}
            variant="improve"
            description={buildImprovementCopy(improvementArea, language, locale)}
          />
        <InsightCard
          icon={
            trendInsight.direction === 'down' ? <ArrowDownRight className="size-5" /> : <ArrowUpRight className="size-5" />
          }
           title={copy.trend}
           variant="trend"
           description={buildTrendCopy(trendInsight, language, locale)}
         />
      </section>
    </section>
  )
}

function normalizeStats(data: StatsResponse) {
  return {
    summary: data.summary,
    history: data.history ?? [],
    goal: data.goal,
    by_topic: data.by_topic ?? [],
    trend: data.trend ?? [],
    failed_distribution: data.failed_distribution ?? [],
    test_type_distribution: data.test_type_distribution ?? [],
    weekly_activity: data.weekly_activity ?? [],
    insights: data.insights ?? {
      strongest_topic: null,
      improvement_area: null,
      trend: {
        window_days: 7,
        recent_accuracy_pct: 0,
        previous_accuracy_pct: 0,
        change_pct_points: 0,
        direction: 'stable' as const,
      },
    },
  }
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#e3eaf2] bg-white/90 p-4 shadow-[0_16px_32px_-28px_rgba(30,58,95,0.45)]">
      <p className="m-0 text-sm text-[#5f7287]">{label}</p>
      <strong className="mt-2 block text-2xl text-[#1E3A5F]">{value}</strong>
    </div>
  )
}

function TrendCard({ series, subtitle }: { series: TrendSeriesItem[]; subtitle: string }) {
  const { language } = useI18n()
  return (
    <Card as="section" className="grid gap-5 p-6 md:p-7">
      <div className="grid gap-1">
        <h2 className="m-0 text-2xl text-[#1E3A5F]">{language === 'en' ? 'Performance evolution' : 'Evolución del rendimiento'}</h2>
        <p className="m-0 text-sm text-[#5f7287]">{subtitle}</p>
      </div>

      {series.length > 0 ? <TrendChart series={series} /> : <InlineMessage message={language === 'en' ? 'There is not enough history yet to draw the daily evolution.' : 'Todavía no hay suficiente histórico para dibujar la evolución diaria.'} />}

      <div className="flex flex-wrap gap-4 border-t border-[#ecf1f6] pt-4 text-sm text-[#5f7287]">
        <LegendItem color={trendPalette.accuracy} label={language === 'en' ? '% accuracy' : '% de aciertos'} />
        <LegendItem color={trendPalette.passRate} label={language === 'en' ? '% passed' : '% de aprobados'} />
      </div>
    </Card>
  )
}

function TrendChart({ series }: { series: TrendSeriesItem[] }) {
  const { language, locale } = useI18n()
  const width = 620
  const height = 260
  const padding = { top: 20, right: 18, bottom: 34, left: 52 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const ticks = [0, 25, 50, 75, 100]

  const accuracyPoints = series.map((item, index) => {
    const x = padding.left + (series.length === 1 ? innerWidth / 2 : (innerWidth / (series.length - 1)) * index)
    const y = padding.top + innerHeight - (clamp(item.accuracy_pct) / 100) * innerHeight
    return { x, y, item }
  })

  const passRatePoints = series.map((item, index) => {
    const x = padding.left + (series.length === 1 ? innerWidth / 2 : (innerWidth / (series.length - 1)) * index)
    const y = padding.top + innerHeight - (clamp(item.pass_rate_pct) / 100) * innerHeight
    return { x, y, item }
  })

  return (
    <div className="overflow-x-auto">
      <svg aria-label={language === 'en' ? 'Performance evolution chart' : 'Gráfico de evolución del rendimiento'} className="min-w-full" viewBox={`0 0 ${width} ${height}`}>
        {ticks.map((tick) => {
          const y = padding.top + innerHeight - (tick / 100) * innerHeight
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e8eef5" strokeDasharray="4 6" />
              <text x={padding.left - 12} y={y + 4} fill="#7a8ca0" fontSize="11" textAnchor="end">
                {tick}%
              </text>
            </g>
          )
        })}

        <path d={buildPolylinePath(accuracyPoints)} fill="none" stroke={trendPalette.accuracy} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <path d={buildPolylinePath(passRatePoints)} fill="none" stroke={trendPalette.passRate} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

        {accuracyPoints.map(({ x, y, item }) => (
          <g key={`accuracy-${item.period}`}>
            <circle cx={x} cy={y} fill="white" r="4.5" stroke={trendPalette.accuracy} strokeWidth="3" />
          </g>
        ))}

        {passRatePoints.map(({ x, y, item }) => (
          <g key={`pass-${item.period}`}>
            <circle cx={x} cy={y} fill="white" r="4.5" stroke={trendPalette.passRate} strokeWidth="3" />
          </g>
        ))}

        {series.map((item, index) => {
          const x = padding.left + (series.length === 1 ? innerWidth / 2 : (innerWidth / (series.length - 1)) * index)
          return (
            <text key={item.period} x={x} y={height - 10} fill="#7a8ca0" fontSize="11" textAnchor="middle">
              {formatChartDay(item.period, locale)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function DistributionCard({ items, totalTests }: { items: TestTypeDistributionItem[]; totalTests: number }) {
  const { language } = useI18n()
  const normalizedItems = normalizeDistributionItems(items).slice(0, 5).map((item, index) => ({
    ...item,
    label: (language === 'en' ? testTypeLabelsEn : testTypeLabelsEs)[item.test_type] ?? item.test_type,
    color: distributionPalette[index % distributionPalette.length],
  }))

  return (
    <Card as="section" className="grid gap-5 p-6 md:p-7">
      <div className="grid gap-1">
        <h2 className="m-0 text-2xl text-[#1E3A5F]">{language === 'en' ? 'Test distribution' : 'Distribución de tests'}</h2>
        <p className="m-0 text-sm text-[#5f7287]">{language === 'en' ? 'Real breakdown by recorded practice type.' : 'Reparto real por tipo de práctica registrada.'}</p>
      </div>

      {normalizedItems.length > 0 ? (
        <>
          <DonutChart items={normalizedItems} total={Math.max(totalTests, normalizedItems.reduce((sum, item) => sum + item.tests, 0))} />
          <div className="grid gap-3">
            {normalizedItems.map((item) => (
              <div key={item.test_type} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
                <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#44576b]">{item.label}</span>
                <span className="font-semibold text-[#1E3A5F]">{item.tests}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <InlineMessage message={language === 'en' ? 'There is not enough distribution yet to show the donut by test type.' : 'Aún no hay distribución suficiente para mostrar el anillo por tipo de test.'} />
      )}
    </Card>
  )
}

function DonutChart({
  items,
  total,
}: {
  items: Array<TestTypeDistributionItem & { label: string; color: string }>
  total: number
}) {
  const { language } = useI18n()
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const segments = items.reduce<Array<(TestTypeDistributionItem & { label: string; color: string; dash: number; offset: number })>>(
    (accumulator, item) => {
      const previousOffset = accumulator.at(-1)?.offset ?? 0
      const previousDash = accumulator.at(-1)?.dash ?? 0
      const offset = previousOffset + previousDash
      accumulator.push({
        ...item,
        dash: (item.tests / total) * circumference,
        offset,
      })
      return accumulator
    },
    [],
  )

  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative size-48">
        <svg className="size-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" fill="none" r={radius} stroke="#edf2f7" strokeWidth="16" />
          {segments.map((item) => (
            <circle
              key={item.test_type}
              cx="80"
              cy="80"
              fill="none"
              r={radius}
              stroke={item.color}
              strokeDasharray={`${item.dash} ${circumference - item.dash}`}
              strokeDashoffset={-item.offset}
              strokeLinecap="round"
              strokeWidth="16"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#7a8ca0]">{language === 'en' ? 'Total' : 'Total'}</span>
          <strong className="text-3xl text-[#1E3A5F]">{total}</strong>
          <span className="text-sm text-[#5f7287]">{language === 'en' ? 'tests' : 'tests'}</span>
        </div>
      </div>
    </div>
  )
}

function ByTopicCard({ topics }: { topics: StatsByTopic[] }) {
  const { language, locale } = useI18n()
  const topicLabelFormatter = buildTopicChartLabelFormatter(topics, language)
  const chartMinWidth = Math.max(topics.length * 108, 640)

  return (
    <Card as="section" className="grid gap-5 p-6 md:p-7">
      <div className="grid gap-1">
        <h2 className="m-0 text-2xl text-[#1E3A5F]">{language === 'en' ? 'Performance by topic' : 'Rendimiento por tema'}</h2>
        <p className="m-0 text-sm text-[#5f7287]">{language === 'en' ? 'Accuracy percentage by topic block according to the data already recorded.' : 'Porcentaje de aciertos por bloque temático según los datos ya registrados.'}</p>
      </div>

      {topics.length > 0 ? (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4" style={{ minWidth: `${chartMinWidth}px` }}>
            <div className="relative h-80 w-10 pt-2 text-xs text-[#7a8ca0]">
              {[100, 75, 50, 25, 0].map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0"
                  style={getTopicAxisLabelStyle(tick)}
                >
                  {tick}%
                </span>
              ))}
            </div>
            <div className="grid min-w-0 gap-4">
              <div
                className="relative grid h-80 items-end gap-4 border-l border-b border-[#e6edf5] px-4 pt-2"
                style={{ gridTemplateColumns: `repeat(${topics.length}, minmax(0, 1fr))` }}
              >
                {[25, 50, 75, 100].map((tick) => (
                  <div
                    key={tick}
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#edf2f7]"
                    style={{ bottom: `${tick}%` }}
                  />
                ))}
                {topics.map((topic) => (
                  <div key={topic.topic_id} className="flex h-full min-w-0 items-end justify-center">
                    <div className="flex h-full w-full min-w-0 flex-col justify-end">
                      <div className="flex min-h-0 flex-1 items-end">
                        <div
                           aria-label={`${topicLabelFormatter(topic)}: ${formatPercentage(topic.accuracy_pct, locale)}`}
                          className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#7aa8ff_0%,#2453d0_100%)] shadow-[0_18px_26px_-22px_rgba(36,83,208,0.9)]"
                          style={{ height: `${Math.max(topic.accuracy_pct, topic.accuracy_pct > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="grid gap-2 px-4 pb-2"
                style={{ gridTemplateColumns: `repeat(${topics.length}, minmax(0, 1fr))` }}
              >
                {topics.map((topic) => (
                  <div key={`label-${topic.topic_id}`} className="grid min-w-0 gap-1 text-center">
                    <strong className="text-sm text-[#1E3A5F]">{Math.round(topic.accuracy_pct)}%</strong>
                    <span className="block min-w-0 truncate text-xs leading-tight text-[#5f7287]" title={topicLabelFormatter(topic)}>
                      {topicLabelFormatter(topic)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
         <InlineMessage message={language === 'en' ? 'There are not enough active topics yet to compare percentages.' : 'Todavía no hay temas suficientes con actividad para comparar porcentajes.'} />
      )}
    </Card>
  )
}

function WeeklyActivityCard({ items }: { items: WeeklyActivityItem[] }) {
  const { language } = useI18n()
  const maxTests = Math.max(...items.map((item) => item.tests), 0)

  return (
    <Card as="section" className="grid gap-5 p-6 md:p-7">
      <div className="grid gap-1">
        <h2 className="m-0 text-2xl text-[#1E3A5F]">{language === 'en' ? 'Weekly activity' : 'Actividad semanal'}</h2>
        <p className="m-0 text-sm text-[#5f7287]">{language === 'en' ? 'Tests taken per day during the last available weekly window.' : 'Tests realizados por día durante la última ventana semanal disponible.'}</p>
      </div>

      {items.length > 0 ? (
        <div className="grid min-h-64 grid-cols-[repeat(auto-fit,minmax(70px,1fr))] items-end gap-4">
          {items.map((item) => (
            <div key={item.date} className="grid gap-3 text-center">
              <div className="flex h-44 items-end justify-center rounded-[20px] bg-[#f6f9fc] px-3 py-4">
                <div
                   aria-label={`${formatWeekDay(item.date, language === 'en' ? 'en-US' : 'es-ES')}: ${item.tests} ${language === 'en' ? 'tests' : 'tests'}`}
                  className="w-full rounded-[16px] bg-[linear-gradient(180deg,#83d0ff_0%,#2C5F8A_100%)] shadow-[0_16px_28px_-22px_rgba(44,95,138,0.9)]"
                  style={{ height: `${maxTests === 0 ? 0 : Math.max((item.tests / maxTests) * 100, item.tests > 0 ? 10 : 0)}%` }}
                />
              </div>
              <div className="grid gap-1">
                <strong className="text-lg text-[#1E3A5F]">{item.tests}</strong>
                 <span className="text-xs uppercase tracking-[0.12em] text-[#7a8ca0]">{formatWeekDay(item.date, language === 'en' ? 'en-US' : 'es-ES')}</span>
               </div>
             </div>
           ))}
         </div>
       ) : (
         <InlineMessage message={language === 'en' ? 'There is still not enough activity to summarize the week.' : 'Aún no hay actividad suficiente para resumir la semana.'} />
       )}
    </Card>
  )
}

function InsightCard({
  title,
  description,
  icon,
  variant,
}: {
  title: string
  description: string
  icon: ReactNode
  variant: 'strong' | 'improve' | 'trend'
}) {
  return (
    <article
      className={clsx(
        'rounded-[24px] p-5 text-white shadow-[0_24px_40px_-30px_rgba(30,58,95,0.55)]',
        variant === 'strong' && 'bg-[linear-gradient(135deg,#1f7a5a_0%,#4bbf8a_100%)]',
        variant === 'improve' && 'bg-[linear-gradient(135deg,#f2a23f_0%,#ef6b5a_100%)]',
        variant === 'trend' && 'bg-[linear-gradient(135deg,#1E3A5F_0%,#2453d0_100%)]',
      )}
    >
      <div className="mb-4 inline-flex rounded-full bg-white/15 p-2.5">{icon}</div>
      <h2 className="m-0 text-xl">{title}</h2>
      <p className="mb-0 mt-3 text-sm leading-6 text-white/88">{description}</p>
    </article>
  )
}

function InlineMessage({ message }: { message: string }) {
  return <p className="m-0 rounded-[20px] bg-[#f6f9fc] p-4 text-sm text-[#5f7287]">{message}</p>
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

type TrendSeriesItem = {
  period: string
  accuracy_pct: number
  pass_rate_pct: number
}

function buildTrendSeries(trend: StatsTrendItem[], history: StatsHistoryItem[]): TrendSeriesItem[] {
  if (trend.length === 0) {
    return []
  }

  const passRateByPeriod = new Map<string, { passed: number; total: number }>()

  history.forEach((item) => {
    const period = item.created_at.slice(0, 10)
    const current = passRateByPeriod.get(period) ?? { passed: 0, total: 0 }
    passRateByPeriod.set(period, {
      passed: current.passed + (item.passed ? 1 : 0),
      total: current.total + 1,
    })
  })

  return trend.map((item) => {
    const passRate = passRateByPeriod.get(item.period)
    return {
      period: item.period,
      accuracy_pct: item.accuracy_pct,
      pass_rate_pct:
        item.pass_rate_pct ?? (passRate && passRate.total > 0 ? Number(((passRate.passed / passRate.total) * 100).toFixed(2)) : 0),
    }
  })
}

function normalizeDistributionItems(items: TestTypeDistributionItem[]): TestTypeDistributionItem[] {
  const grouped = new Map<string, TestTypeDistributionItem>()

  items.forEach((item) => {
    const normalizedType = item.test_type === 'TOPIC' || item.test_type === 'FAILED' ? item.test_type : 'RANDOM'
    const current = grouped.get(normalizedType)

    if (current) {
      grouped.set(normalizedType, {
        test_type: normalizedType,
        tests: current.tests + item.tests,
        percentage: current.percentage + item.percentage,
      })
      return
    }

    grouped.set(normalizedType, {
      test_type: normalizedType,
      tests: item.tests,
      percentage: item.percentage,
    })
  })

  return [...grouped.values()].sort((left, right) => right.tests - left.tests)
}

function buildPeriodLabel(trend: StatsTrendItem[], weeklyActivity: WeeklyActivityItem[], language: 'es' | 'en', locale: string) {
  const firstPeriod = trend[0]?.period ?? weeklyActivity[0]?.date
  const lastPeriod = trend[trend.length - 1]?.period ?? weeklyActivity[weeklyActivity.length - 1]?.date

  if (!firstPeriod || !lastPeriod) {
    return language === 'en' ? 'There is still not enough temporal data.' : 'Sin datos temporales suficientes todavía.'
  }

  return language === 'en'
    ? `Data from ${formatLongDate(firstPeriod, locale)} to ${formatLongDate(lastPeriod, locale)}`
    : `Datos del ${formatLongDate(firstPeriod, locale)} al ${formatLongDate(lastPeriod, locale)}`
}

function inferStrongestTopic(topics: StatsByTopic[]): TopicInsight | null {
  if (topics.length === 0) {
    return null
  }

  const best = [...topics].sort((left, right) => right.accuracy_pct - left.accuracy_pct)[0]
  return mapTopicToInsight(best)
}

function inferImprovementArea(topics: StatsByTopic[]): TopicInsight | null {
  if (topics.length === 0) {
    return null
  }

  const weakest = [...topics].sort((left, right) => left.accuracy_pct - right.accuracy_pct)[0]
  return mapTopicToInsight(weakest)
}

function mapTopicToInsight(topic: StatsByTopic): TopicInsight {
  return {
    topic_id: topic.topic_id,
    topic_name: topic.topic_name,
    correct: topic.correct,
    wrong: topic.wrong,
    accuracy_pct: topic.accuracy_pct,
  }
}

function inferTrendInsight(trend: StatsTrendItem[]): AccuracyTrendInsight {
  if (trend.length < 2) {
    return {
      window_days: Math.max(trend.length, 1),
      recent_accuracy_pct: trend.at(-1)?.accuracy_pct ?? 0,
      previous_accuracy_pct: trend.at(-2)?.accuracy_pct ?? 0,
      change_pct_points: 0,
      direction: 'stable',
    }
  }

  const recent = trend.at(-1)?.accuracy_pct ?? 0
  const previous = trend.at(-2)?.accuracy_pct ?? 0
  const change = Number((recent - previous).toFixed(2))

  return {
    window_days: 2,
    recent_accuracy_pct: recent,
    previous_accuracy_pct: previous,
    change_pct_points: change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
  }
}

function buildStrongestTopicCopy(topic: TopicInsight | null, language: 'es' | 'en', locale: string) {
  if (!topic) {
    return language === 'en'
      ? 'There is still not enough volume to identify a clearly strong topic.'
      : 'Todavía no hay volumen suficiente para identificar un tema claramente fuerte.'
  }

  return language === 'en'
    ? `${formatTopicLabel(topic, language)} stands out with ${formatPercentage(topic.accuracy_pct, locale)} accuracy and a balance of ${topic.correct} correct answers against ${topic.wrong} wrong ones.`
    : `${formatTopicLabel(topic, language)} destaca con ${formatPercentage(topic.accuracy_pct, locale)} de aciertos y un balance de ${topic.correct} correctas frente a ${topic.wrong} falladas.`
}

function buildImprovementCopy(topic: TopicInsight | null, language: 'es' | 'en', locale: string) {
  if (!topic) {
    return language === 'en'
      ? 'There is still no comparable data to point to a specific improvement area.'
      : 'Aún no hay datos comparables para señalar una zona de mejora concreta.'
  }

  return language === 'en'
    ? `${formatTopicLabel(topic, language)} is the block most worth reviewing: ${formatPercentage(topic.accuracy_pct, locale)} accuracy and ${topic.wrong} accumulated mistakes.`
    : `${formatTopicLabel(topic, language)} es el bloque que más conviene repasar: ${formatPercentage(topic.accuracy_pct, locale)} de aciertos y ${topic.wrong} errores acumulados.`
}

function formatTopicLabel(topic: Pick<StatsByTopic, 'topic_id' | 'topic_name'> | Pick<TopicInsight, 'topic_id' | 'topic_name'>, language: 'es' | 'en') {
  const name = topic.topic_name?.trim()
  return name && name.length <= 24 ? name : `${language === 'en' ? 'Topic' : 'Tema'} ${topic.topic_id}`
}

function buildTopicChartLabelFormatter(topics: StatsByTopic[], language: 'es' | 'en') {
  const useTopicNames = topics.every((topic) => Boolean(topic.topic_name?.trim()))

  return (topic: Pick<StatsByTopic, 'topic_id' | 'topic_name'>) => {
    if (useTopicNames) {
      return topic.topic_name!.trim()
    }

     return `${language === 'en' ? 'Topic' : 'Tema'} ${topic.topic_id}`
   }
 }

function buildTrendCopy(trend: AccuracyTrendInsight, language: 'es' | 'en', locale: string) {
  if (trend.direction === 'up') {
    return language === 'en'
      ? `In the last ${trend.window_days} days your accuracy has increased by ${formatPercentage(Math.abs(trend.change_pct_points), locale)} compared with the previous period.`
      : `En los últimos ${trend.window_days} días tu precisión ha subido ${formatPercentage(Math.abs(trend.change_pct_points), locale)} respecto al periodo anterior.`
  }

  if (trend.direction === 'down') {
    return language === 'en'
      ? `In the last ${trend.window_days} days your accuracy has dropped by ${formatPercentage(Math.abs(trend.change_pct_points), locale)}. It is worth reviewing the topics with the lowest percentage.`
      : `En los últimos ${trend.window_days} días tu precisión ha bajado ${formatPercentage(Math.abs(trend.change_pct_points), locale)}. Conviene revisar los temas con peor porcentaje.`
  }

  return language === 'en'
    ? `Your accuracy remains stable in the recent ${trend.window_days}-day window, with no relevant changes compared with the previous period.`
    : `Tu precisión se mantiene estable en la ventana reciente de ${trend.window_days} días, sin cambios relevantes frente al periodo anterior.`
}

function buildPolylinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function formatPercentage(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

function formatLongDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(parseStatsDate(value))
}

function formatWeekDay(value: string, locale: string) {
  const label = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(parseStatsDate(value))
  return label.endsWith('.') ? label.slice(0, -1) : label
}

function formatChartDay(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(parseStatsDate(value))
}

function clamp(value: number) {
  return Math.max(0, Math.min(value, 100))
}

function getTopicAxisLabelStyle(tick: number) {
  if (tick === 100) {
    return { top: 0 }
  }

  if (tick === 0) {
    return { bottom: 0 }
  }

  return {
    bottom: `${tick}%`,
    transform: 'translateY(50%)',
  }
}
