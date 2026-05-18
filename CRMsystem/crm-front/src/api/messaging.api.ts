import { api } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessagingPlatform = 'telegram' | 'viber' | 'whatsapp';
export type ConversationStatus = 'open' | 'closed' | 'pending';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageContentType = 'text' | 'image' | 'file' | 'sticker' | 'location' | 'contact';

export interface Message {
    id: number;
    conversationId: number;
    externalMessageId: string | null;
    direction: MessageDirection;
    contentType: MessageContentType;
    text: string | null;
    mediaUrl: string | null;
    fileName: string | null;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    sentByUserId: number | null;
    platformTimestamp: string;
    createdAt: string;
}

export interface Conversation {
    id: number;
    externalChatId: string;
    platform: MessagingPlatform;
    contactName: string | null;
    contactHandle: string | null;
    avatarUrl: string | null;
    status: ConversationStatus;
    clientId: number | null;
    lastMessageText: string | null;
    lastMessageAt: string | null;
    messages?: Message[];
    createdAt: string;
    updatedAt: string;
}

export interface MessagingStats {
    total: number;
    open: number;
    closed: number;
    pending?: number;
    byPlatform: { platform: string; count: string }[];
}

export interface SendMessageDto {
    conversationId: number;
    text: string;
    sentByUserId?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const messagingApi = {
    /** Список розмов з опціональним фільтром */
    getConversations: (platform?: string, status?: string) =>
        api.get<Conversation[]>('/messaging/conversations', {
            ...(platform && platform !== 'all' ? { platform } : {}),
            ...(status && status !== 'all' ? { status } : {}),
        }),

    /** Деталі розмови + повідомлення */
    getConversation: (id: number) =>
        api.get<Conversation>(`/messaging/conversations/${id}`),

    /** Повідомлення окремо */
    getMessages: (conversationId: number) =>
        api.get<Message[]>(`/messaging/conversations/${conversationId}/messages`),

    /** Надіслати відповідь */
    sendMessage: (dto: SendMessageDto) =>
        api.post<Message>('/messaging/send', dto),

    /** Прив'язати до клієнта CRM */
    linkToClient: (conversationId: number, clientId: number) =>
        api.patch<Conversation>(`/messaging/conversations/${conversationId}/link-client`, { clientId }),

    /** Закрити розмову */
    close: (conversationId: number) =>
        api.patch<Conversation>(`/messaging/conversations/${conversationId}/close`, {}),

    /** Відкрити розмову */
    open: (conversationId: number) =>
        api.patch<Conversation>(`/messaging/conversations/${conversationId}/open`, {}),

    /** Статистика */
    getStats: () =>
        api.get<MessagingStats>('/messaging/stats'),
};
