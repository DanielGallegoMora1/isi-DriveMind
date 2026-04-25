import { useEffect } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { useI18n } from '../features/i18n'

type PolicySection = {
  id: string
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const policyContent = {
  en: {
    eyebrow: 'Security and privacy',
    title: 'Privacy policy',
    description: 'Information about how your data is processed',
    badge: 'Informational legal document',
    documentTitle: 'Privacy Policy',
    indexTitle: 'Privacy policy index',
    updatedAt: 'Last updated',
    back: 'Back to settings',
    sections: [
      { id: 'general-information', title: '1. General information', paragraphs: ['At DriveMind we are committed to protecting the privacy of our users. This policy describes how we collect, use, and protect your personal information when using our platform.'] },
      { id: 'data-we-collect', title: '2. Data we collect', paragraphs: ['We may collect the following data:'], bullets: ['Identification data (name, email)', 'Usage data (test results, progress, statistics)', 'Technical information (IP address, device, browser)', 'User preferences (settings, language, notifications)'] },
      { id: 'purpose-of-processing', title: '3. Purpose of processing', paragraphs: ['We use the data to:'], bullets: ['Provide and improve the service', 'Personalize the user experience', 'Generate statistics and performance analysis', 'Send notifications related to platform usage'] },
      { id: 'data-retention', title: '4. Data retention', paragraphs: ['Data will be kept while the user maintains an active account or for the time needed to comply with legal obligations.'] },
      { id: 'data-sharing', title: '5. Data sharing', paragraphs: ['We do not share your personal data with third parties, except for:'], bullets: ['Legal obligation', 'Providers required for service operation (hosting, analytics)'] },
      { id: 'user-rights', title: '6. User rights', paragraphs: ['The user may:', 'To exercise these rights, you can contact us.'], bullets: ['Access their data', 'Correct or delete it', 'Request restriction of processing', 'Request data portability'] },
      { id: 'security', title: '7. Security', paragraphs: ['We apply technical and organizational measures to protect your data from unauthorized access, loss, or alteration.'] },
      { id: 'policy-changes', title: '8. Changes to the policy', paragraphs: ['We may update this policy at any time. Users will be notified in case of relevant changes.'] },
      { id: 'contact', title: '9. Contact', paragraphs: ['If you have any questions about this policy, you can contact us through the in-app support channels.'] },
    ] satisfies PolicySection[],
  },
  es: {
    eyebrow: 'Seguridad y privacidad',
    title: 'Política de privacidad',
    description: 'Información sobre el tratamiento de tus datos',
    badge: 'Documento legal informativo',
    documentTitle: 'Política de Privacidad',
    indexTitle: 'Índice de la política de privacidad',
    updatedAt: 'Última actualización',
    back: 'Volver a ajustes',
    sections: [
      { id: 'informacion-general', title: '1. Información general', paragraphs: ['En DriveMind nos comprometemos a proteger la privacidad de nuestros usuarios. Esta política describe cómo recopilamos, utilizamos y protegemos tu información personal al utilizar nuestra plataforma.'] },
      { id: 'datos-que-recopilamos', title: '2. Datos que recopilamos', paragraphs: ['Podemos recopilar los siguientes datos:'], bullets: ['Datos de identificación (nombre, email)', 'Datos de uso (resultados de tests, progreso, estadísticas)', 'Información técnica (dirección IP, dispositivo, navegador)', 'Preferencias de usuario (configuración, idioma, notificaciones)'] },
      { id: 'finalidad-del-tratamiento', title: '3. Finalidad del tratamiento', paragraphs: ['Utilizamos los datos para:'], bullets: ['Proporcionar y mejorar el servicio', 'Personalizar la experiencia del usuario', 'Generar estadísticas y análisis de rendimiento', 'Enviar notificaciones relacionadas con el uso de la plataforma'] },
      { id: 'conservacion-de-los-datos', title: '4. Conservación de los datos', paragraphs: ['Los datos se conservarán mientras el usuario mantenga su cuenta activa o durante el tiempo necesario para cumplir con obligaciones legales.'] },
      { id: 'comparticion-de-datos', title: '5. Compartición de datos', paragraphs: ['No compartimos tus datos personales con terceros, salvo:'], bullets: ['Obligación legal', 'Proveedores necesarios para el funcionamiento del servicio (hosting, analítica)'] },
      { id: 'derechos-del-usuario', title: '6. Derechos del usuario', paragraphs: ['El usuario puede:', 'Para ejercer estos derechos, puedes contactar con nosotros.'], bullets: ['Acceder a sus datos', 'Rectificarlos o eliminarlos', 'Solicitar la limitación del tratamiento', 'Solicitar la portabilidad de los datos'] },
      { id: 'seguridad', title: '7. Seguridad', paragraphs: ['Aplicamos medidas técnicas y organizativas para proteger tus datos frente a accesos no autorizados, pérdida o alteración.'] },
      { id: 'cambios-en-la-politica', title: '8. Cambios en la política', paragraphs: ['Podemos actualizar esta política en cualquier momento. Se notificará a los usuarios en caso de cambios relevantes.'] },
      { id: 'contacto', title: '9. Contacto', paragraphs: ['Para cualquier duda sobre esta política, puedes contactarnos a través del soporte de la aplicación.'] },
    ] satisfies PolicySection[],
  },
} as const

export function PrivacyPolicyPage() {
  const { language, locale } = useI18n()
  const copy = policyContent[language]

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      // jsdom does not implement scrollTo
    }
  }, [])

  const lastUpdated = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <section className="grid gap-6 text-[#1E3A5F] [scroll-behavior:smooth]">
      <header className="flex flex-col gap-4 rounded-[30px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.96))] p-6 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:flex-row md:items-start md:justify-between md:p-8">
        <div className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.16em] uppercase text-[#2C5F8A]">{copy.eyebrow}</p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">{copy.description}</p>
        </div>

        <div className="inline-flex items-center gap-3 self-start rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-sm font-medium text-[#2C5F8A] shadow-[0_14px_30px_-24px_rgba(36,83,208,0.45)]">
          <ShieldCheck className="size-4" strokeWidth={2} />
          {copy.badge}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card as="nav" aria-label={copy.indexTitle} className="grid gap-3 self-start p-5 xl:sticky xl:top-6">
          <h2 className="m-0 text-lg">{copy.indexTitle}</h2>
          <div className="grid gap-2">
            {copy.sections.map((section) => (
              <a key={section.id} className="rounded-xl px-3 py-2 text-sm text-[#2C5F8A] transition-colors hover:bg-[#eef4ff] hover:text-[#1E3A5F]" href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </div>
        </Card>

        <Card as="article" className="grid gap-0 overflow-hidden p-0">
          <div className="border-b border-[#e7edf4] bg-[linear-gradient(180deg,#ffffff,#f8fbfe)] px-6 py-6 md:px-8 md:py-7">
            <h2 className="m-0 text-[clamp(1.7rem,3vw,2.3rem)] leading-tight">{copy.documentTitle}</h2>
          </div>

          <div className="grid gap-0 px-6 py-2 md:px-8">
            {copy.sections.map((section) => (
              <section key={section.id} className="scroll-mt-8 border-b border-[#e7edf4] py-6 last:border-b-0" id={section.id}>
                <div className="grid gap-4">
                  <h3 className="m-0 text-xl font-bold leading-snug text-[#1E3A5F]">{section.title}</h3>

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="m-0 text-[15px] leading-8 text-[#40566f] md:text-base">{paragraph}</p>
                  ))}

                  {section.bullets ? (
                    <ul className="m-0 grid gap-3 pl-5 text-[15px] leading-8 text-[#40566f] marker:text-[#2453d0] md:text-base">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <footer className="flex flex-col gap-4 border-t border-[#e7edf4] bg-[#fbfdff] px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="m-0 text-sm text-[#5f7287]">{copy.updatedAt}: {lastUpdated}</p>

            <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e8eef5] px-5 py-3 text-sm font-semibold text-[#1E3A5F] shadow-[0_14px_24px_-18px_rgba(30,58,95,0.5)] transition-colors duration-200 hover:bg-[#dce7f2] md:w-auto" to="/settings">
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="size-4" strokeWidth={2} />
                {copy.back}
              </span>
            </Link>
          </footer>
        </Card>
      </div>
    </section>
  )
}
