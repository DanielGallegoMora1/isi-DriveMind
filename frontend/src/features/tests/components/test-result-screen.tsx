import type { ReactNode } from 'react'
import {
  Check,
  CircleCheckBig,
  CircleX,
  Eye,
  House,
  RotateCcw,
  Target,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { formatAccuracy, formatElapsedTime, getModeBadge } from '../test-session-helpers'
import type { GeneratedTest, TestResult } from '../types'

type TestResultScreenProps = {
  answeredCount: number
  elapsedSeconds: number
  permitLabel: string
  result: TestResult
  test: GeneratedTest
  testLabel: string
  onBackToDashboard: () => void
  onReviewAnswers: () => void
  onStartAnotherTest: () => void
}

const resultAppearance = {
  passed: {
    surface: 'bg-[#E8F5E9]',
    accent: 'text-[#2E7D5B]',
    iconSurface: 'bg-[#2E7D5B]',
    copy: 'Muy bien hecho, sigue así',
  },
  failed: {
    surface: 'bg-[#FDECEC]',
    accent: 'text-[#C0392B]',
    iconSurface: 'bg-[#E74C3C]',
    copy: 'No te desanimes, sigue practicando y mejorarás',
  },
} as const

export function TestResultScreen({
  answeredCount,
  elapsedSeconds,
  permitLabel,
  result,
  test,
  testLabel,
  onBackToDashboard,
  onReviewAnswers,
  onStartAnotherTest,
}: TestResultScreenProps) {
  const appearance = result.passed ? resultAppearance.passed : resultAppearance.failed
  const totalQuestions = test.questions.length
  const unansweredCount = result.review_items.length > 0
    ? result.review_items.filter((item) => item.is_answered === false).length
    : Math.max(totalQuestions - answeredCount, 0)
  const accuracy = totalQuestions > 0 ? (result.correct_count / totalQuestions) * 100 : 0
  const statusTitle = result.passed ? 'Test superado' : 'Test no superado'

  return (
    <Card as="section" className="overflow-hidden rounded-[32px] border-[#dfe7f0] p-0 shadow-[0_28px_55px_-38px_rgba(30,58,95,0.35)]">
      <div className={`grid justify-items-center gap-4 px-6 py-10 text-center md:px-10 ${appearance.surface}`}>
        <span className={`inline-flex size-20 items-center justify-center rounded-full ${appearance.iconSurface} text-white shadow-[0_18px_32px_-24px_rgba(30,58,95,0.42)]`}>
          <ResultStatusIcon passed={result.passed} />
        </span>

        <div className="grid gap-2">
          <h1 className={`m-0 text-[clamp(2rem,4vw,3.1rem)] leading-none ${appearance.accent}`}>{statusTitle}</h1>
          <p className="m-0 text-sm text-[#5f7287] md:text-base">{appearance.copy}</p>
        </div>

      </div>

      <div className="grid gap-6 bg-white px-6 py-6 md:px-10 md:py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResultMetric accent="green" icon={<Check aria-hidden="true" className="size-5" strokeWidth={2.2} />} label="Aciertos" value={String(result.correct_count)} />
          <ResultMetric accent="red" icon={<X aria-hidden="true" className="size-5" strokeWidth={2.2} />} label="Fallos" value={String(result.wrong_count)} />
          <ResultMetric accent="amber" icon={<TriangleAlert aria-hidden="true" className="size-5" strokeWidth={2} />} label="Sin responder" value={String(unansweredCount)} />
          <ResultMetric accent="blue" icon={<Target aria-hidden="true" className="size-5" strokeWidth={2} />} label="Tasa de acierto" value={formatAccuracy(accuracy)} />
        </div>

        <div className="grid gap-2 border-t border-[#e7edf4] pt-4 text-sm text-[#5f7287] md:grid-cols-3 md:gap-4">
          <MetaItem label="Tiempo" value={formatElapsedTime(elapsedSeconds)} />
          <MetaItem label="Tipo de test" value={getModeBadge(test.mode, testLabel)} />
          <MetaItem label="Permiso" value={permitLabel} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ActionButton icon={<Eye aria-hidden="true" className="size-5" strokeWidth={2} />} label="Revisar respuestas" onClick={onReviewAnswers} variant="secondary" />
          <ActionButton icon={<RotateCcw aria-hidden="true" className="size-5" strokeWidth={2} />} label="Nuevo test" onClick={onStartAnotherTest} variant="primary" />
          <ActionButton icon={<House aria-hidden="true" className="size-5" strokeWidth={2} />} label="Dashboard" onClick={onBackToDashboard} variant="secondary" />
        </div>
      </div>
    </Card>
  )
}

function ResultMetric({
  accent,
  icon,
  label,
  value,
}: {
  accent: 'green' | 'red' | 'amber' | 'blue'
  icon: ReactNode
  label: string
  value: string
}) {
  const accentClasses = {
    green: 'border-[#cfe7d7] bg-[#f5fbf6] text-[#2E7D5B]',
    red: 'border-[#f1d0cc] bg-[#fff7f6] text-[#C0392B]',
    amber: 'border-[#f4e3bf] bg-[#fffaf0] text-[#b7791f]',
    blue: 'border-[#d7e4f3] bg-[#f5f9fd] text-[#2453d0]',
  } as const

  return (
    <div className={`grid min-h-[168px] justify-items-center gap-4 rounded-[22px] border p-6 text-center ${accentClasses[accent]}`}>
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-white/90">{icon}</span>
      <div className="grid justify-items-center gap-2 text-center">
        <strong className="text-3xl leading-none">{value}</strong>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <p className="m-0 text-center md:text-left">
      <span className="font-semibold text-[#1E3A5F]">{label}: </span>
      <span>{value}</span>
    </p>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'primary'
          ? 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1E3A5F] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(30,58,95,0.82)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16314f]'
          : 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d8e3ee] bg-white px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-[#f7fafd]'
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ResultStatusIcon({ passed }: { passed: boolean }) {
  if (passed) {
    return <CircleCheckBig aria-hidden="true" className="size-9" strokeWidth={1.9} />
  }

  return <CircleX aria-hidden="true" className="size-9" strokeWidth={1.9} />
}
