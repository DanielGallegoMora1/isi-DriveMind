import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Bot, MessageSquareText, Plus, SendHorizonal } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { ApiError } from '../../../lib/http'
import { useI18n } from '../../i18n'
import { useConversationDetail, useConversations, useCreateConversation, useSendMessage } from '../hooks/use-ai-assistant'
import type { ConversationDetail, Message } from '../types'

type AiChatWorkspaceProps = {
  accessToken: string | null
  userName?: string | null
}

type AssistantStatus = {
  label: string
  dotClassName: string
}

export function AiChatWorkspace({ accessToken, userName }: AiChatWorkspaceProps) {
  const { language, locale } = useI18n()
  const queryClient = useQueryClient()
  const conversationsQuery = useConversations(accessToken)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)

  const conversations = conversationsQuery.data ?? []
  const effectiveSelectedConversationId = useMemo(() => {
    return selectedConversationId ?? conversations[0]?.id ?? null
  }, [conversations, selectedConversationId])

  const conversationDetailQuery = useConversationDetail(accessToken, effectiveSelectedConversationId)
  const createConversationMutation = useCreateConversation(accessToken)
  const sendMessageMutation = useSendMessage(accessToken)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === effectiveSelectedConversationId) ?? null,
    [conversations, effectiveSelectedConversationId],
  )

  const copy = language === 'en'
    ? {
        createConversationError: 'Could not create the conversation.',
        sendMessageError: 'Could not send the message to the assistant.',
        conversations: 'Conversations',
        conversationsDescription: 'Access your history and resume the context where you left it.',
        creating: 'Creating…',
        newConversation: 'New conversation',
        loadConversationsTitle: 'Could not load conversations',
        retry: 'Retry',
        emptyConversationsTitle: 'You do not have conversations yet',
        emptyConversationsDescription: 'Create your first chat to start asking the assistant questions.',
        createConversation: 'Create conversation',
        openConversationPreview: 'Open the conversation to see the latest exchange.',
        assistantTitle: 'DriveMind Assistant',
        untitledConversation: 'New conversation',
        session: userName ? `Session for ${userName}` : 'Authenticated session',
        updated: (value: string) => `Updated ${value}`,
        readyToStart: 'Ready to start',
        loadConversationTitle: 'Could not load conversation',
        loadConversationDescription: 'Try reloading the detail.',
        assistantTyping: 'The assistant is typing…',
        noMessagesTitle: selectedConversation ? 'There are no messages yet' : 'Start a conversation',
        noMessagesDescription: selectedConversation
          ? 'Send your first question to receive an answer from the assistant.'
          : 'Choose an existing conversation or write below to open a new one automatically.',
        composerLabel: 'Write your question here…',
        composerPlaceholder: 'Write your question here…',
        activeConversationHint: 'The reply will be added to the active conversation.',
        newConversationHint: 'If you send now, DriveMind will create a new conversation automatically.',
        sending: 'Sending…',
        send: 'Send',
      }
    : {
        createConversationError: 'No se pudo crear la conversación.',
        sendMessageError: 'No se pudo enviar el mensaje al asistente.',
        conversations: 'Conversaciones',
        conversationsDescription: 'Accede a tu historial y retoma el contexto donde lo dejaste.',
        creating: 'Creando…',
        newConversation: 'Nueva conversación',
        loadConversationsTitle: 'No se pudieron cargar las conversaciones',
        retry: 'Reintentar',
        emptyConversationsTitle: 'Todavía no tienes conversaciones',
        emptyConversationsDescription: 'Crea tu primer chat para empezar a consultar dudas al asistente.',
        createConversation: 'Crear conversación',
        openConversationPreview: 'Abre la conversación para ver el último intercambio.',
        assistantTitle: 'DriveMind Assistant',
        untitledConversation: 'Nueva conversación',
        session: userName ? `Sesión de ${userName}` : 'Sesión autenticada',
        updated: (value: string) => `Actualizado ${value}`,
        readyToStart: 'Listo para empezar',
        loadConversationTitle: 'No se pudo cargar la conversación',
        loadConversationDescription: 'Prueba a recargar el detalle.',
        assistantTyping: 'El asistente está escribiendo…',
        noMessagesTitle: selectedConversation ? 'Todavía no hay mensajes' : 'Empezá una conversación',
        noMessagesDescription: selectedConversation
          ? 'Envía tu primera pregunta para recibir una respuesta del asistente.'
          : 'Elige una conversación existente o escribe abajo para abrir una nueva automáticamente.',
        composerLabel: 'Escribe tu pregunta aquí…',
        composerPlaceholder: 'Escribe tu pregunta aquí…',
        activeConversationHint: 'La respuesta se añadirá a la conversación activa.',
        newConversationHint: 'Si envías ahora, DriveMind creará una conversación nueva automáticamente.',
        sending: 'Enviando…',
        send: 'Enviar',
      }

  const messages = conversationDetailQuery.data?.messages ?? []
  const assistantStatus = getAssistantStatus({
    accessToken,
    conversationsError: conversationsQuery.isError,
    detailError: conversationDetailQuery.isError,
    createError: createConversationMutation.isError,
    sendError: sendMessageMutation.isError,
    isLoading:
      conversationsQuery.isLoading ||
      (Boolean(effectiveSelectedConversationId) && conversationDetailQuery.isLoading && !conversationDetailQuery.data),
    isSending: sendMessageMutation.isPending,
    language,
  })

  const conversationPreviews = useMemo(() => {
    return new Map(
      conversations.map((conversation) => {
        const cachedDetail =
          queryClient.getQueryData<ConversationDetail>(['ai', 'conversations', conversation.id]) ??
          (conversation.id === effectiveSelectedConversationId ? conversationDetailQuery.data : undefined)

        return [conversation.id, getConversationPreview(cachedDetail?.messages, language)]
      }),
    )
  }, [conversations, conversationDetailQuery.data, effectiveSelectedConversationId, language, queryClient])

  const conversationTitles = useMemo(() => {
    return new Map(
      conversations.map((conversation) => {
        const cachedDetail =
          queryClient.getQueryData<ConversationDetail>(['ai', 'conversations', conversation.id]) ??
          (conversation.id === effectiveSelectedConversationId ? conversationDetailQuery.data : undefined)

        return [conversation.id, getConversationTitle(conversation.title, cachedDetail?.messages, copy.untitledConversation)]
      }),
    )
  }, [conversations, conversationDetailQuery.data, copy.untitledConversation, effectiveSelectedConversationId, queryClient])

  const isComposerBusy = createConversationMutation.isPending || sendMessageMutation.isPending
  const canSubmit = draft.trim().length > 0 && !isComposerBusy
  const showConversationListEmpty = !conversationsQuery.isLoading && !conversationsQuery.isError && conversations.length === 0

  async function handleCreateConversation() {
    setComposerError(null)

    try {
      const conversation = await createConversationMutation.mutateAsync({ title: null })
      setSelectedConversationId(conversation.id)
    } catch (error) {
      setComposerError(getErrorMessage(error, copy.createConversationError))
    }
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId)
    setComposerError(null)
  }

  async function submitDraft() {
    const trimmedDraft = draft.trim()

    if (!trimmedDraft) {
      return
    }

    setComposerError(null)

    try {
      let conversationId = effectiveSelectedConversationId

      if (!conversationId) {
        const conversation = await createConversationMutation.mutateAsync({
          title: buildConversationTitle(trimmedDraft),
        })

        conversationId = conversation.id
        setSelectedConversationId(conversation.id)
      }

      setDraft('')
      await sendMessageMutation.mutateAsync({ conversation_id: conversationId, content: trimmedDraft })
    } catch (error) {
      setDraft(trimmedDraft)
      setComposerError(getErrorMessage(error, copy.sendMessageError))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitDraft()
  }

  return (
    <section className="grid min-h-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 border-[#d6e1ef] bg-[linear-gradient(180deg,#f9fbfe_0%,#f2f6fb_100%)] p-5">
        <div className="space-y-4">
          <div>
            <p className="m-0 text-xs font-bold tracking-[0.18em] uppercase text-[#315f99]">{copy.conversations}</p>
            <h2 className="mt-2 mb-1 text-[1.35rem] text-[#0f2745]">{copy.conversations}</h2>
            <p className="m-0 text-sm text-[#607286]">{copy.conversationsDescription}</p>
          </div>

          <Button
            type="button"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2f6df3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#245fda]"
            disabled={createConversationMutation.isPending}
            onClick={() => void handleCreateConversation()}
          >
            <Plus className="size-4" />
            {createConversationMutation.isPending ? copy.creating : copy.newConversation}
          </Button>
        </div>

        {conversationsQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-[#dbe6f2] bg-white/80">
            <Spinner />
          </div>
        ) : conversationsQuery.isError ? (
          <EmptyState
             title={copy.loadConversationsTitle}
             description={getErrorMessage(conversationsQuery.error, language === 'en' ? 'Try again in a few seconds.' : 'Prueba de nuevo en unos segundos.')}
             action={
               <Button type="button" variant="secondary" onClick={() => void conversationsQuery.refetch()}>
                 {copy.retry}
               </Button>
             }
           />
         ) : showConversationListEmpty ? (
           <EmptyState
             title={copy.emptyConversationsTitle}
             description={copy.emptyConversationsDescription}
             action={
               <Button type="button" variant="secondary" onClick={() => void handleCreateConversation()}>
                 {copy.createConversation}
               </Button>
             }
           />
        ) : (
          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === effectiveSelectedConversationId

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void handleSelectConversation(conversation.id)}
                  className={clsx(
                    'grid w-full gap-3 rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                    isSelected
                      ? 'border-[#6f96d6] bg-[#eaf1ff] shadow-[0_24px_36px_-30px_rgba(18,42,76,0.55)]'
                      : 'border-[#d9e3ef] bg-white hover:border-[#a8c0e0] hover:bg-[#f8fbff]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 overflow-hidden">
                    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                      <span
                        className={clsx(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border',
                          isSelected
                            ? 'border-[#c4d5f7] bg-[#d8e6ff] text-[#1f4fa2]'
                            : 'border-[#dce5ef] bg-[#f4f7fb] text-[#4b6785]',
                        )}
                      >
                        <MessageSquareText className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="m-0 truncate break-all font-semibold text-[#102540]">
                           {conversationTitles.get(conversation.id) ?? getConversationTitle(conversation.title, undefined, copy.untitledConversation)}
                          </p>
                          <p className="mt-1 mb-0 line-clamp-2 break-all text-sm leading-5 text-[#7b8b9f]">
                            {conversationPreviews.get(conversation.id) ?? copy.openConversationPreview}
                          </p>
                      </div>
                    </div>

                     <span className="shrink-0 text-xs font-medium text-[#6d7f95]">{formatRelativeTime(conversation.updated_at, language)}</span>
                   </div>
                 </button>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-[#cad8ea] p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 bg-[#102540] px-6 py-5 text-white">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Bot className="size-6 text-[#8dd3ff]" />
            </div>

            <div className="min-w-0">
               <p className="m-0 text-xs font-bold tracking-[0.18em] uppercase text-[#8dd3ff]">{copy.assistantTitle}</p>
                 <h2 className="mt-2 mb-1 line-clamp-1 text-[1.4rem] text-white">
                   {selectedConversation
                     ? getConversationTitle(selectedConversation.title, messages, copy.untitledConversation)
                     : copy.untitledConversation}
                 </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#d5e4f7]">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className={clsx('size-2.5 rounded-full', assistantStatus.dotClassName)} />
                    {assistantStatus.label}
                  </span>
                 <span className="text-[#a7bfd9]">{copy.session}</span>
               </div>
             </div>
           </div>

          <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[#d5e4f7]">
            {selectedConversation ? copy.updated(formatRelativeTime(selectedConversation.updated_at, language)) : copy.readyToStart}
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] px-5 py-6 md:px-6">
          {effectiveSelectedConversationId && conversationDetailQuery.isLoading && !conversationDetailQuery.data ? (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-[#dbe6f2] bg-white/70">
              <Spinner />
            </div>
          ) : effectiveSelectedConversationId && conversationDetailQuery.isError ? (
            <EmptyState
             title={copy.loadConversationTitle}
             description={getErrorMessage(conversationDetailQuery.error, copy.loadConversationDescription)}
             action={
               <Button type="button" variant="secondary" onClick={() => void conversationDetailQuery.refetch()}>
                 {copy.retry}
               </Button>
             }
           />
          ) : messages.length > 0 ? (
            <div className="grid gap-5">
              {messages.map((message) => {
                const isUser = message.role === 'user'

                return (
                  <article key={message.id} className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
                    <div className={clsx('flex max-w-[84%] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
                      <div
                        className={clsx(
                          'rounded-3xl px-4 py-3 shadow-[0_24px_36px_-30px_rgba(18,42,76,0.45)]',
                          isUser
                            ? 'rounded-br-md bg-[#102540] text-white'
                            : 'rounded-bl-md border border-[#d8e1eb] bg-[#eef2f6] text-[#18314f]',
                        )}
                      >
                        {isUser ? (
                          <p className="m-0 whitespace-pre-wrap text-sm leading-6">
                            {message.content}
                          </p>
                        ) : (
                          <div className="prose prose-sm prose-slate max-w-none leading-6 *:first:mt-0 *:last:mb-0 prose-p:my-2 prose-ul:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                       <span className="px-1 text-xs text-[#7b8b9f]">{formatMessageTimestamp(message.created_at, locale)}</span>
                     </div>
                   </article>
                )
              })}

              {sendMessageMutation.isPending ? (
                <article className="flex justify-start">
                  <div className="flex max-w-[84%] flex-col gap-2 items-start">
                    <div className="rounded-3xl rounded-bl-md border border-[#d8e1eb] bg-[#eef2f6] px-4 py-3 text-[#18314f] shadow-[0_24px_36px_-30px_rgba(18,42,76,0.45)]">
                      <div className="flex items-center gap-3 text-sm">
                        <Spinner size="sm" className="border-[#ced9e7] border-t-[#2f6df3]" />
                         <span>{copy.assistantTyping}</span>
                       </div>
                     </div>
                   </div>
                </article>
              ) : null}
            </div>
          ) : (
            <EmptyState
               title={copy.noMessagesTitle}
               description={copy.noMessagesDescription}
             />
           )}
        </div>

        <form className="border-t border-[#dde6f0] bg-white px-5 py-3 md:px-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2 rounded-3xl border border-[#d8e2ee] bg-[#fbfdff] px-3 py-2 shadow-[0_24px_36px_-30px_rgba(18,42,76,0.25)]">
            <label className="sr-only" htmlFor="ai-chat-message">
               {copy.composerLabel}
             </label>

            <textarea
              id="ai-chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()

                  if (canSubmit) {
                    void submitDraft()
                  }
                }
              }}
               placeholder={copy.composerPlaceholder}
              rows={2}
              className="w-full resize-none border-0 bg-transparent px-2 py-0.5 text-sm leading-5 text-[#18314f] outline-none placeholder:text-[#8a9bae]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf2f7] px-2 pt-2">
              <p className="m-0 text-sm text-[#66788d]">
                 {effectiveSelectedConversationId ? copy.activeConversationHint : copy.newConversationHint}
               </p>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex min-h-11 items-center gap-2 rounded-2xl bg-[#102540] px-4 py-2 text-sm hover:bg-[#0d2038]"
              >
                <SendHorizonal className="size-4" />
                 {isComposerBusy ? copy.sending : copy.send}
               </Button>
            </div>
          </div>

          {composerError ? <p className="mt-3 mb-0 text-sm text-red-600">{composerError}</p> : null}
        </form>
      </Card>
    </section>
  )
}

function getConversationTitle(title: string | null, messages?: Message[], fallbackTitle = 'Nueva conversación') {
  if (title?.trim()) {
    return title
  }

  const firstUserMessage = messages?.find((message) => message.role === 'user' && message.content.trim().length > 0)

  if (firstUserMessage) {
    return buildConversationTitle(firstUserMessage.content)
  }

  return fallbackTitle
}

function getConversationPreview(messages?: Message[], language: 'es' | 'en' = 'es') {
  const lastMessage = messages ? [...messages].reverse().find((message) => message.content.trim().length > 0) : undefined

  if (!lastMessage) {
    return language === 'en' ? 'No messages yet.' : 'Sin mensajes todavía.'
  }

  return lastMessage.content.replace(/\s+/g, ' ').trim()
}

function buildConversationTitle(content: string) {
  const compactContent = content.replace(/\s+/g, ' ').trim()

  if (compactContent.length <= 48) {
    return compactContent
  }

  return `${compactContent.slice(0, 45).trimEnd()}...`
}

function formatRelativeTime(value: string, language: 'es' | 'en') {
  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return language === 'en' ? 'Just now' : 'Recién'
  }

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000))

  if (diffMinutes < 60) {
    return language === 'en'
      ? diffMinutes <= 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
      : diffMinutes <= 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
     return language === 'en' ? (diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`) : diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 30) {
     return language === 'en' ? (diffDays === 1 ? '1 day ago' : `${diffDays} days ago`) : diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`
  }

  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths < 12) {
     return language === 'en' ? (diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`) : diffMonths === 1 ? 'Hace 1 mes' : `Hace ${diffMonths} meses`
  }

  const diffYears = Math.floor(diffMonths / 12)
  return language === 'en' ? (diffYears === 1 ? '1 year ago' : `${diffYears} years ago`) : diffYears === 1 ? 'Hace 1 año' : `Hace ${diffYears} años`
}

function formatMessageTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getAssistantStatus({
  accessToken,
  conversationsError,
  detailError,
  createError,
  sendError,
  isLoading,
  isSending,
  language,
}: {
  accessToken: string | null
  conversationsError: boolean
  detailError: boolean
  createError: boolean
  sendError: boolean
  isLoading: boolean
  isSending: boolean
  language: 'es' | 'en'
}): AssistantStatus {
  const copy = language === 'en'
    ? {
        authRequired: 'Authentication required',
        degraded: 'Service issues detected',
        responding: 'Assistant responding',
        connecting: 'Connecting to the assistant',
        available: 'Assistant available',
      }
    : {
        authRequired: 'Autenticación requerida',
        degraded: 'Servicio con incidencias',
        responding: 'Asistente respondiendo',
        connecting: 'Conectando con el asistente',
        available: 'Asistente disponible',
      }

  if (!accessToken) {
    return {
       label: copy.authRequired,
      dotClassName: 'bg-slate-400',
    }
  }

  if (conversationsError || detailError || createError || sendError) {
    return {
      label: copy.degraded,
      dotClassName: 'bg-amber-400',
    }
  }

  if (isSending) {
    return {
      label: copy.responding,
      dotClassName: 'bg-sky-400',
    }
  }

  if (isLoading) {
    return {
      label: copy.connecting,
      dotClassName: 'bg-sky-400',
    }
  }

  return {
    label: copy.available,
    dotClassName: 'bg-emerald-400',
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
