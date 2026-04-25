import { useEffect } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { useI18n } from '../features/i18n'

type TermsSection = {
  id: string
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const termsContent = {
  en: {
    eyebrow: 'Security and privacy',
    title: 'Terms and conditions',
    description: 'Rules for using the platform',
    badge: 'Contractual legal document',
    documentTitle: 'Terms and Conditions of Use',
    updatedAt: 'Last updated',
    back: 'Back to settings',
    sections: [
      { id: 'acceptance-of-terms', title: '1. Acceptance of the terms', paragraphs: ['By accessing and using the DriveMind platform, the user agrees to comply with these Terms and Conditions. If the user does not agree with any of them, they must refrain from using the service.'] },
      { id: 'service-description', title: '2. Service description', paragraphs: ['DriveMind is an online platform intended to prepare users for theoretical driving exams through tests, performance analytics, and intelligent assistance.'] },
      { id: 'user-registration', title: '3. User registration', paragraphs: ['To access certain features, the user must register by providing truthful and updated information. The user is responsible for keeping their credentials confidential.'] },
      { id: 'proper-use', title: '4. Proper use of the service', paragraphs: ['The user agrees to:'], bullets: ['Use the platform lawfully', 'Not perform activities that could damage the system', 'Not attempt to access other users’ accounts', 'Not use the platform for fraudulent or illegal purposes'] },
      { id: 'intellectual-property', title: '5. Intellectual property', paragraphs: ['All platform content (texts, designs, questions, software) belongs to DriveMind or its licensors. Reproduction or distribution without authorization is prohibited.'] },
      { id: 'liability', title: '6. Liability', paragraphs: ['DriveMind does not guarantee that:', 'Use of the platform is the responsibility of the user.'], bullets: ['The user will pass the official exam', 'The service will be free of errors or interruptions'] },
      { id: 'account-suspension', title: '7. Account suspension or cancellation', paragraphs: ['DriveMind may suspend or cancel accounts in cases of:'], bullets: ['Breach of these terms', 'Improper use of the service'] },
      { id: 'data-protection', title: '8. Data protection', paragraphs: ['Processing of personal data is governed by the platform Privacy Policy.'] },
      { id: 'service-modifications', title: '9. Service modifications', paragraphs: ['DriveMind reserves the right to modify or interrupt the service at any time.'] },
      { id: 'applicable-law', title: '10. Applicable law', paragraphs: ['These terms are governed by the legislation in force in the relevant country.'] },
      { id: 'contact', title: '11. Contact', paragraphs: ['For any inquiry, the user can contact us through the platform support channels.'] },
    ] satisfies TermsSection[],
  },
  es: {
    eyebrow: 'Seguridad y privacidad',
    title: 'Términos y condiciones',
    description: 'Normas de uso de la plataforma',
    badge: 'Documento legal contractual',
    documentTitle: 'Términos y Condiciones de Uso',
    updatedAt: 'Última actualización',
    back: 'Volver a ajustes',
    sections: [
      { id: 'aceptacion-de-los-terminos', title: '1. Aceptación de los términos', paragraphs: ['Al acceder y utilizar la plataforma DriveMind, el usuario acepta cumplir con los presentes Términos y Condiciones. Si no está de acuerdo con alguno de ellos, deberá abstenerse de utilizar el servicio.'] },
      { id: 'descripcion-del-servicio', title: '2. Descripción del servicio', paragraphs: ['DriveMind es una plataforma online destinada a la preparación de exámenes teóricos de conducción mediante tests, análisis de rendimiento y asistencia inteligente.'] },
      { id: 'registro-de-usuario', title: '3. Registro de usuario', paragraphs: ['Para acceder a determinadas funcionalidades, el usuario deberá registrarse proporcionando información veraz y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales.'] },
      { id: 'uso-adecuado-del-servicio', title: '4. Uso adecuado del servicio', paragraphs: ['El usuario se compromete a:'], bullets: ['Utilizar la plataforma de forma lícita', 'No realizar actividades que puedan dañar el sistema', 'No intentar acceder a cuentas de otros usuarios', 'No usar la plataforma con fines fraudulentos o ilegales'] },
      { id: 'propiedad-intelectual', title: '5. Propiedad intelectual', paragraphs: ['Todos los contenidos de la plataforma (textos, diseños, preguntas, software) son propiedad de DriveMind o de sus licenciantes. Queda prohibida su reproducción o distribución sin autorización.'] },
      { id: 'responsabilidad', title: '6. Responsabilidad', paragraphs: ['DriveMind no garantiza que:', 'El uso de la plataforma es bajo la responsabilidad del usuario.'], bullets: ['El usuario apruebe el examen oficial', 'El servicio esté libre de errores o interrupciones'] },
      { id: 'suspension-o-cancelacion-de-la-cuenta', title: '7. Suspensión o cancelación de la cuenta', paragraphs: ['DriveMind podrá suspender o cancelar cuentas en caso de:'], bullets: ['Incumplimiento de estos términos', 'Uso indebido del servicio'] },
      { id: 'proteccion-de-datos', title: '8. Protección de datos', paragraphs: ['El tratamiento de datos personales se rige por la Política de Privacidad de la plataforma.'] },
      { id: 'modificaciones-del-servicio', title: '9. Modificaciones del servicio', paragraphs: ['DriveMind se reserva el derecho de modificar o interrumpir el servicio en cualquier momento.'] },
      { id: 'legislacion-aplicable', title: '10. Legislación aplicable', paragraphs: ['Estos términos se rigen por la legislación vigente en el país correspondiente.'] },
      { id: 'contacto', title: '11. Contacto', paragraphs: ['Para cualquier consulta, el usuario puede contactar a través del soporte de la plataforma.'] },
    ] satisfies TermsSection[],
  },
} as const

export function TermsAndConditionsPage() {
  const { language, locale } = useI18n()
  const copy = termsContent[language]

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
          <FileText className="size-4" strokeWidth={2} />
          {copy.badge}
        </div>
      </header>

      <div className="grid w-full gap-6">
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
