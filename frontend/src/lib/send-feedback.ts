export const feedbackTypeOptions = [
  'Sugerencia de mejora',
  'Reportar un error',
  'Nueva funcionalidad',
  'Experiencia de usuario',
] as const

export type FeedbackType = (typeof feedbackTypeOptions)[number]

export type SendFeedbackPayload = {
  title: string
  description: string
  feedbackType: FeedbackType
  rating: number
  userName?: string
  userEmail?: string
}

// Simulación local de envío para la interfaz de feedback.
export async function submitFeedback(_payload: SendFeedbackPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 700))

  return {
    ok: true,
  }
}
