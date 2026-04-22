export type Conversation = {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export type Message = {
  id: string
  conversation_id: string
  role: MessageRole | string
  content: string
  created_at: string
}

export type ConversationDetail = {
  conversation: Conversation
  messages: Message[]
}

export type CreateConversationInput = {
  title?: string | null
}

export type CreateMessageInput = {
  conversation_id: string
  content: string
}

export type CreateMessageResponse = {
  message: Message
  assistant_reply: string
}
