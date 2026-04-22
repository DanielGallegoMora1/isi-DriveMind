import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as aiAssistantApi from '../api/ai-assistant.api'
import type { CreateConversationInput, CreateMessageInput } from '../types'

export function useConversations(token: string | null) {
  return useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: () => aiAssistantApi.listConversations(token ?? ''),
    enabled: Boolean(token),
  })
}

export function useConversationDetail(token: string | null, conversationId: string | null) {
  return useQuery({
    queryKey: ['ai', 'conversations', conversationId],
    queryFn: () => aiAssistantApi.getConversationDetail(token ?? '', conversationId ?? ''),
    enabled: Boolean(token) && Boolean(conversationId),
  })
}

export function useCreateConversation(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateConversationInput) => aiAssistantApi.createConversation(token ?? '', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
    },
  })
}

export function useSendMessage(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMessageInput) => aiAssistantApi.sendMessage(token ?? '', input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['ai', 'conversations', variables.conversation_id] })
    },
  })
}
