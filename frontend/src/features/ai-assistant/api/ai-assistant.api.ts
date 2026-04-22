import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type {
  Conversation,
  ConversationDetail,
  CreateConversationInput,
  CreateMessageInput,
  CreateMessageResponse,
} from '../types'

const aiBaseUrl = `${env.aiServiceUrl}/v1/ai`

type ItemsResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

type CreateConversationResponse = {
  conversation: Conversation
}

export function listConversations(token: string) {
  return requestJson<ItemsResponse<Conversation>>(`${aiBaseUrl}/conversations`, {
    method: 'GET',
    token,
  }).then((response) => response.items)
}

export function createConversation(token: string, input: CreateConversationInput) {
  return requestJson<CreateConversationResponse>(`${aiBaseUrl}/conversations`, {
    method: 'POST',
    token,
    body: JSON.stringify({ title: input.title ?? null }),
  }).then((response) => response.conversation)
}

export function getConversationDetail(token: string, conversationId: string) {
  return requestJson<ConversationDetail>(`${aiBaseUrl}/conversations/${conversationId}`, {
    method: 'GET',
    token,
  })
}

export function sendMessage(token: string, input: CreateMessageInput) {
  return requestJson<CreateMessageResponse>(`${aiBaseUrl}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  })
}
