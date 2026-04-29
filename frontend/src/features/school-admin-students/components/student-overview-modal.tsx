import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import {
  Activity,
  BadgeCheck,
  Clock3,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SchoolAdminStudent } from '../types'
import {
  formatAverageScore,
  formatEnrollmentDate,
  formatLastActivity,
  formatTestsCompleted,
  getDerivedAverageTime,
  getStudentInitials,
} from './student-overview-utils'

type StudentOverviewModalProps = {
  student: SchoolAdminStudent
  onClose: () => void
}

type OverviewMetric = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  accent: string
  background: string
  ring: string
}

const OVERVIEW_METRICS_STYLES = [
  {
    accent: 'text-[#2453D0]',
    background: 'bg-[#EEF4FF]',
    ring: 'ring-[#D6E4FF]',
  },
  {
    accent: 'text-[#2E7D5B]',
    background: 'bg-[#ECF8F2]',
    ring: 'ring-[#D7F0E4]',
  },
  {
    accent: 'text-[#7C3AED]',
    background: 'bg-[#F3EEFF]',
    ring: 'ring-[#E6DAFF]',
  },
  {
    accent: 'text-[#DD8A17]',
    background: 'bg-[#FFF4E7]',
    ring: 'ring-[#FFE5BF]',
  },
] as const

export function StudentOverviewModal({ student, onClose }: StudentOverviewModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const metrics: OverviewMetric[] = [
    {
      label: 'Tests realizados',
      value: formatTestsCompleted(student.tests_completed),
      detail: 'Actividad acumulada',
      icon: FileText,
      ...OVERVIEW_METRICS_STYLES[0],
    },
    {
      label: 'Tasa aprobados',
      value: `${Math.max(0, Math.min(100, Math.round(Number(student.pass_rate_pct ?? 0))))}%`,
      detail: 'Rendimiento reciente',
      icon: BadgeCheck,
      ...OVERVIEW_METRICS_STYLES[1],
    },
    {
      label: 'Nota media',
      value: formatAverageScore(student.average_score),
      detail: 'Consistencia global',
      icon: TrendingUp,
      ...OVERVIEW_METRICS_STYLES[2],
    },
    {
      label: 'Tiempo medio',
      value: getDerivedAverageTime(student),
      detail: 'Estimación visual',
      icon: Clock3,
      ...OVERVIEW_METRICS_STYLES[3],
    },
  ]

  return (
    <div
      aria-labelledby="student-overview-modal-title"
      aria-modal="true"
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.62)] px-4 py-6 backdrop-blur-[3px] transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      data-testid="student-overview-backdrop"
      onClick={onClose}
      role="dialog"
    >
      <div
        className={clsx(
          'w-full max-w-4xl rounded-[32px] border border-white/75 bg-white p-6 shadow-[0_36px_100px_-32px_rgba(15,23,42,0.5)] transition-all duration-200 md:p-8',
          isVisible ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-[#E8EEF5] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[#16324F] text-lg font-semibold text-white shadow-[0_18px_34px_-24px_rgba(22,50,79,0.8)]">
              {getStudentInitials(student.full_name)}
            </span>
            <div>
              <h2 className="m-0 text-[1.85rem] font-semibold tracking-[-0.04em] text-[#16324F]" id="student-overview-modal-title">
                {student.full_name}
              </h2>
              <p className="mt-1 mb-0 text-sm font-medium tracking-[0.08em] text-[#6F8197] uppercase">
                Progreso del alumno
              </p>
            </div>
          </div>

          <button
            aria-label={`Cerrar detalle de ${student.full_name}`}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#DBE4EE] bg-white text-[#5F7287] transition-colors hover:bg-[#F5F8FB]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <article className={clsx('rounded-[24px] p-4 ring-1', metric.background, metric.ring)} key={metric.label}>
                <div className="flex items-start justify-between gap-3">
                  <span className={clsx('inline-flex size-11 items-center justify-center rounded-full bg-white/90 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.35)]', metric.accent)}>
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <span className={clsx('rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.12em] uppercase', metric.accent, 'bg-white/70')}>
                    KPI
                  </span>
                </div>
                <p className="mt-5 mb-1 text-[1.85rem] font-semibold tracking-[-0.04em] text-[#16324F]">{metric.value}</p>
                <p className="m-0 text-sm font-semibold text-[#314B68]">{metric.label}</p>
                <p className="mt-1 mb-0 text-xs leading-5 text-[#64748B]">{metric.detail}</p>
              </article>
            )
          })}
        </div>

        <section className="mt-6 rounded-[28px] border border-[#E8EEF5] bg-[#FBFDFF] p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2453D0] shadow-[0_12px_24px_-18px_rgba(36,83,208,0.55)]">
              <Activity className="size-5" strokeWidth={1.9} />
            </span>
            <div>
              <h3 className="m-0 text-lg font-semibold text-[#16324F]">Información del alumno</h3>
              <p className="mt-1 mb-0 text-sm text-[#64748B]">Resumen operativo para seguimiento rápido y contexto inmediato.</p>
            </div>
          </div>

          <dl className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-4 rounded-[24px] border border-[#E9EFF6] bg-white p-4">
              <InfoRow icon={Mail} label="Email" value={student.email} />
              <InfoRow icon={FileText} label="Fecha de matriculación" value={formatEnrollmentDate(student.created_at)} />
            </div>

            <div className="grid gap-4 rounded-[24px] border border-[#E9EFF6] bg-white p-4">
              <InfoRow icon={Phone} label="Teléfono" value={student.phone?.trim() || 'Sin teléfono registrado'} />
              <InfoRow icon={Clock3} label="Última actividad" value={formatLastActivity(student)} />
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F7FB] text-[#5D7288]">
        <Icon className="size-4.5" strokeWidth={1.9} />
      </span>
      <div>
        <dt className="text-xs font-semibold tracking-[0.12em] uppercase text-[#7A8CA4]">{label}</dt>
        <dd className="mt-1 text-sm font-semibold text-[#16324F]">{value}</dd>
      </div>
    </div>
  )
}
