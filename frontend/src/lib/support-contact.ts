export type SupportContactPayload = {
  fullName: string
  email: string
  inquiryType: string
  subject: string
  message: string
}

// Placeholder local until the project exposes a real support endpoint.
export async function submitSupportContact(_payload: SupportContactPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 600))

  return {
    ok: true,
  }
}
