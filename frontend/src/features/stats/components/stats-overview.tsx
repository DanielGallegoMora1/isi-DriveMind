import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { useStats } from '../hooks/use-stats'

type StatsOverviewProps = {
  accessToken: string | null
}

function formatAccuracy(value: number) {
  return `${value.toFixed(1)}%`
}

export function StatsOverview({ accessToken }: StatsOverviewProps) {
  const statsQuery = useStats(accessToken)

  if (statsQuery.isLoading) {
    return (
      <Card className="flex items-center justify-center gap-3 py-12">
        <Spinner />
        <span className="text-sm text-[#d8e1f0]">Cargando estadísticas desde core-service…</span>
      </Card>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <EmptyState
        title="No pudimos cargar tus estadísticas"
        description="Reintentá en unos segundos. La vista depende del endpoint real de core-service."
      />
    )
  }

  const { summary, by_topic, failed_distribution, history, trend } = statsQuery.data

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatMetric label="Tests completados" value={String(summary.total_tests)} />
        <StatMetric label="Aprobados" value={String(summary.passed_tests)} />
        <StatMetric label="Reprobados" value={String(summary.failed_tests)} />
        <StatMetric label="Precisión global" value={formatAccuracy(summary.accuracy_pct)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section" className="grid gap-3">
          <div>
            <h3 className="m-0 text-xl text-white">Rendimiento por tema</h3>
            <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">Mostramos datos reales si core-service ya los genera.</p>
          </div>
          {by_topic.length === 0 ? (
            <InlineEmptyState message="Por ahora el backend devuelve esta sección vacía." />
          ) : (
            <ul className="m-0 grid gap-3 p-0">
              {by_topic.map((item) => (
                <li key={item.topic_id} className="list-none rounded-2xl bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#d8e1f0]">
                  Tema {item.topic_id}: {item.correct} correctas · {item.wrong} incorrectas · {formatAccuracy(item.accuracy_pct)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="grid gap-3">
          <div>
            <h3 className="m-0 text-xl text-white">Historial reciente</h3>
            <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">Ideal para mostrar evolución cuando el backend tenga historial completo.</p>
          </div>
          {history.length === 0 ? (
            <InlineEmptyState message="Todavía no hay historial detallado disponible desde el endpoint actual." />
          ) : (
            <ul className="m-0 grid gap-3 p-0">
              {history.map((item) => (
                <li key={item.test_id} className="list-none rounded-2xl bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#d8e1f0]">
                  Test #{item.test_id}: {item.correct_count} correctas · {item.wrong_count} incorrectas · {formatAccuracy(item.accuracy_pct)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="grid gap-3">
          <div>
            <h3 className="m-0 text-xl text-white">Tendencia temporal</h3>
            <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">La UI ya contempla esta sección, pero hoy puede venir vacía.</p>
          </div>
          {trend.length === 0 ? (
            <InlineEmptyState message="No hay puntos de tendencia para graficar todavía." />
          ) : (
            <ul className="m-0 grid gap-3 p-0">
              {trend.map((item) => (
                <li key={item.period} className="list-none rounded-2xl bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#d8e1f0]">
                  {item.period}: {item.tests} tests · {formatAccuracy(item.accuracy_pct)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="grid gap-3">
          <div>
            <h3 className="m-0 text-xl text-white">Distribución de fallos</h3>
            <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">Cuando core-service lo exponga, esta vista permitirá detectar puntos débiles.</p>
          </div>
          {failed_distribution.length === 0 ? (
            <InlineEmptyState message="No hay distribución de fallos disponible en la respuesta actual." />
          ) : (
            <ul className="m-0 grid gap-3 p-0">
              {failed_distribution.map((item) => (
                <li key={item.topic_id} className="list-none rounded-2xl bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#d8e1f0]">
                  Tema {item.topic_id}: {item.wrong_count} errores acumulados
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <span className="block text-sm text-[#9fb2cc]">{label}</span>
      <strong className="mt-2 block text-3xl text-white">{value}</strong>
    </Card>
  )
}

function InlineEmptyState({ message }: { message: string }) {
  return <p className="m-0 rounded-2xl bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#9fb2cc]">{message}</p>
}
