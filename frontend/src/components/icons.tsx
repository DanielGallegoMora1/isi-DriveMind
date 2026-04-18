import {
  BarChart3,
  Bike,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ClipboardList,
  Home,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  RefreshCw,
  Settings,
  Shuffle,
  TrendingUp,
  Truck,
} from 'lucide-react'

type IconProps = {
  className?: string
}

export function EmailIcon({ className = 'size-[18px]' }: IconProps) {
  return <Mail aria-hidden="true" className={className} strokeWidth={1.9} />
}

export function LockIcon({ className = 'size-[18px]' }: IconProps) {
  return <Lock aria-hidden="true" className={className} strokeWidth={1.9} />
}

export function HomeIcon({ className = 'size-5' }: IconProps) {
  return <Home aria-hidden="true" className={className} strokeWidth={1.75} />
}

export function SettingsIcon({ className = 'size-5' }: IconProps) {
  return <Settings aria-hidden="true" className={className} strokeWidth={1.75} />
}

export function TestsIcon({ className = 'size-5' }: IconProps) {
  return <ClipboardList aria-hidden="true" className={className} strokeWidth={1.75} />
}

export function StatsIcon({ className = 'size-5' }: IconProps) {
  return <BarChart3 aria-hidden="true" className={className} strokeWidth={1.75} />
}

export function AiChatIcon({ className = 'size-5' }: IconProps) {
  return <MessageCircle aria-hidden="true" className={className} strokeWidth={1.75} />
}

export function ProgressTrendIcon({ className = 'size-11' }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-flex items-center justify-center rounded-[18px] bg-[#EDE7F6] text-[#7C3AED]`}
    >
      <TrendingUp className="size-8" strokeWidth={2.15} />
    </span>
  )
}

export function ArrowLeftIcon({ className = 'size-4' }: IconProps) {
  return <ChevronLeft aria-hidden="true" className={className} strokeWidth={2} />
}

export function ArrowRightIcon({ className = 'size-4' }: IconProps) {
  return <ChevronRight aria-hidden="true" className={className} strokeWidth={2} />
}

export function CarIcon({ className = 'size-10' }: IconProps) {
  return <Car aria-hidden="true" className={className} strokeWidth={1.7} />
}

export function MotorcycleIcon({ className = 'size-10' }: IconProps) {
  return <Bike aria-hidden="true" className={className} strokeWidth={1.7} />
}

export function TruckIcon({ className = 'size-10' }: IconProps) {
  return <Truck aria-hidden="true" className={className} strokeWidth={1.7} />
}

export function LayersIcon({ className = 'size-6' }: IconProps) {
  return <Layers aria-hidden="true" className={className} strokeWidth={1.8} />
}

export function ShuffleIcon({ className = 'size-6' }: IconProps) {
  return <Shuffle aria-hidden="true" className={className} strokeWidth={1.8} />
}

export function RefreshIcon({ className = 'size-6' }: IconProps) {
  return <RefreshCw aria-hidden="true" className={className} strokeWidth={1.8} />
}

export function EmptyStateIcon({ className = 'size-7' }: IconProps) {
  return <CircleX aria-hidden="true" className={className} strokeWidth={1.5} />
}
