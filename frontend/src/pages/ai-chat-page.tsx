import { AiChatWorkspace } from '../features/ai-assistant'
import { useAuth } from '../features/auth'

export function AiChatPage() {
  const { accessToken, user } = useAuth()

  return (
    <section className="grid h-[calc(100svh-2.5rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6 overflow-hidden lg:h-[calc(100svh-5rem)]">
      <header className="rounded-[26px] border border-[#d7e3f3] bg-[linear-gradient(135deg,#eff5ff_0%,#f8fbff_52%,#edf3fb_100%)] px-5 py-4 shadow-[0_20px_40px_-36px_rgba(30,58,95,0.32)]">
        <p className="m-0 text-[0.78rem] font-bold tracking-[0.18em] uppercase text-[#315f99]">Asistente IA</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-[clamp(1.6rem,3vw,2.2rem)] leading-none text-[#102540]">Centro de conversaciones</h1>
          </div>

          <div className="rounded-full border border-[#d5e2f1] bg-white/80 px-3 py-1.5 text-sm font-medium text-[#24476d] shadow-[0_14px_28px_-24px_rgba(30,58,95,0.45)]">
            {user?.full_name ? `Sesión de ${user.full_name}` : 'Sesión autenticada'}
          </div>
        </div>
      </header>

      <AiChatWorkspace accessToken={accessToken} userName={user?.full_name} />
    </section>
  )
}
