import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/inbox.css';
import { messagingApi } from '../api/messaging.api';
import type { Conversation, Message, MessagingPlatform } from '../api/messaging.api';
import { API_BASE_URL } from '../api/apiClient';

const POLLING_INTERVAL_MS = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
    telegram: { icon: 'fa-telegram',  color: '#3b82f6', label: 'Telegram'  },
    viber:    { icon: 'fa-viber',     color: '#a855f7', label: 'Viber'     },
    whatsapp: { icon: 'fa-whatsapp',  color: '#22c55e', label: 'WhatsApp'  },
};

function formatTime(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now  = new Date();
    const isToday =
        date.getDate()     === now.getDate()     &&
        date.getMonth()    === now.getMonth()    &&
        date.getFullYear() === now.getFullYear();
    if (isToday) {
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getDate()     === yesterday.getDate()     &&
        date.getMonth()    === yesterday.getMonth()    &&
        date.getFullYear() === yesterday.getFullYear();
    return isYesterday ? 'Вчора' : date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

function getInitial(name: string | null): string {
    return (name || '?').charAt(0).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingDots: React.FC = () => (
    <div style={{ display: 'flex', gap: 6, padding: '20px 30px' }}>
        {[0, 1, 2].map(i => (
            <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#cbd5e1',
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
            }} />
        ))}
    </div>
);

const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div style={{
        margin: '12px 16px', padding: '10px 14px',
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 10, color: '#ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        fontSize: 13,
    }}>
        <span><i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />{message}</span>
        <button onClick={onRetry} style={{
            background: 'none', border: '1px solid #fca5a5', color: '#ef4444',
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
        }}>Повторити</button>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Inbox: React.FC = () => {
    const [conversations, setConversations]   = useState<Conversation[]>([]);
    const [convsLoading, setConvsLoading]     = useState(true);
    const [convsError, setConvsError]         = useState<string | null>(null);

    const [activePlatform, setActivePlatform] = useState<string>('all');
    const [activeConvId, setActiveConvId]     = useState<number | null>(null);

    const [messages, setMessages]             = useState<Message[]>([]);
    const [msgsLoading, setMsgsLoading]       = useState(false);
    const [msgsError, setMsgsError]           = useState<string | null>(null);

    const [messageInput, setMessageInput]     = useState('');
    const [sending, setSending]               = useState(false);
    const [sendError, setSendError]           = useState<string | null>(null);

    const [stats, setStats]                   = useState<Record<string, number>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load conversations. silent=true keeps the UI from blinking during polling.
    const loadConversations = useCallback(async (platform?: string, silent = false) => {
        if (!silent) setConvsLoading(true);
        setConvsError(null);
        try {
            const data = await messagingApi.getConversations(
                platform && platform !== 'all' ? platform : undefined,
            );
            setConversations(data);
            setActiveConvId(prev => {
                if (data.length === 0) return null;
                if (prev !== null && data.some(conv => conv.id === prev)) return prev;
                return data[0].id;
            });
        } catch (e: any) {
            if (!silent) setConvsError(e.message ?? 'Не вдалось завантажити розмови');
        } finally {
            if (!silent) setConvsLoading(false);
        }
    }, []);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const s = await messagingApi.getStats();
            const map: Record<string, number> = {};
            s.byPlatform.forEach(p => { map[p.platform] = Number(p.count); });
            map.all = s.open;
            setStats(map);
        } catch { /* non-critical */ }
    }, []);

    // Load messages. silent=true is used for auto-refresh without loader flicker.
    const loadMessages = useCallback(async (convId: number, silent = false) => {
        if (!silent) setMsgsLoading(true);
        setMsgsError(null);
        try {
            const data = await messagingApi.getMessages(convId);
            setMessages(data);
        } catch (e: any) {
            if (!silent) setMsgsError(e.message ?? 'Не вдалось завантажити повідомлення');
        } finally {
            if (!silent) setMsgsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
        loadStats();
    }, [loadConversations, loadStats]);

    useEffect(() => {
        if (activeConvId !== null) loadMessages(activeConvId);
    }, [activeConvId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Real-time updates: backend pushes new messages through SSE.
    useEffect(() => {
        const source = new EventSource(`${API_BASE_URL}/messaging/events`);

        source.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as {
                    type: 'message_created' | 'conversation_updated';
                    conversationId: number;
                    message?: Message;
                    conversation?: Conversation | null;
                };

                if (payload.type === 'message_created' && payload.message) {
                    if (activeConvId === payload.conversationId) {
                        setMessages(prev =>
                            prev.some(msg => msg.id === payload.message!.id)
                                ? prev
                                : [...prev, payload.message!]
                        );
                    }

                    if (payload.conversation) {
                        const shouldShowConversation =
                            activePlatform === 'all' || payload.conversation.platform === activePlatform;

                        if (shouldShowConversation) {
                            setConversations(prev => {
                                const withoutUpdated = prev.filter(conv => conv.id !== payload.conversation!.id);
                                return [payload.conversation!, ...withoutUpdated];
                            });
                        }
                    } else {
                        loadConversations(activePlatform, true);
                    }

                    loadStats();
                }

                if (payload.type === 'conversation_updated' && payload.conversation) {
                    setConversations(prev =>
                        prev.map(conv => conv.id === payload.conversation!.id ? payload.conversation! : conv)
                    );
                    loadStats();
                }
            } catch {
                // Ignore malformed SSE events.
            }
        };

        source.onerror = () => {
            // Якщо SSE тимчасово впаде, EventSource сам пробує перепідключитися.
        };

        return () => source.close();
    }, [activeConvId, activePlatform, loadConversations, loadStats]);

    // Fallback polling: залишаємо рідшу перевірку, якщо SSE недоступний.
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(() => {
            loadConversations(activePlatform, true);
            loadStats();
            if (activeConvId !== null) loadMessages(activeConvId, true);
        }, POLLING_INTERVAL_MS * 5);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [activePlatform, activeConvId, loadConversations, loadMessages, loadStats]);

    const handlePlatformClick = (platform: string) => {
        setActivePlatform(platform);
        setActiveConvId(null);
        setMessages([]);
        loadConversations(platform === 'all' ? undefined : platform);
    };

    const handleOpenConversation = async (conversationId: number) => {
        const opened = await messagingApi.open(conversationId);
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: opened.status } : c));
        loadStats();
        return opened;
    };

    const handleSend = async () => {
        if (!messageInput.trim() || activeConvId === null || sending) return;
        const text = messageInput.trim();
        const convBeforeSend = conversations.find(c => c.id === activeConvId);

        setMessageInput('');
        setSendError(null);
        setSending(true);

        const optimistic: Message = {
            id: Date.now(), conversationId: activeConvId,
            externalMessageId: null, direction: 'outbound', contentType: 'text',
            text, mediaUrl: null, fileName: null, status: 'sent',
            sentByUserId: null, platformTimestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            if (convBeforeSend?.status === 'closed') {
                await handleOpenConversation(activeConvId);
            }

            const saved = await messagingApi.sendMessage({ conversationId: activeConvId, text });
            setMessages(prev => {
                const withoutOptimistic = prev.filter(m => m.id !== optimistic.id);
                return withoutOptimistic.some(m => m.id === saved.id)
                    ? withoutOptimistic
                    : [...withoutOptimistic, saved];
            });
            setConversations(prev =>
                prev.map(c => c.id === activeConvId
                    ? { ...c, status: 'open', lastMessageText: text, lastMessageAt: new Date().toISOString() }
                    : c)
            );
            loadStats();
        } catch (e: any) {
            setSendError(e.message ?? 'Не вдалось надіслати');
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setMessageInput(text);
        } finally {
            setSending(false);
        }
    };

    const activeConv     = conversations.find(c => c.id === activeConvId) ?? null;
    const filteredConvs  = activePlatform === 'all'
        ? conversations
        : conversations.filter(c => c.platform === activePlatform);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="inbox-container fade-in-card">

            {/* LEFT SIDEBAR */}
            <div className="inbox-sidebar">
                <div className="inbox-header">
                    <div className="inbox-logo"><i className="fa-solid fa-inbox" /></div>
                    <div>
                        <h2>Inbox</h2>
                        <span>{stats.all !== undefined ? `${stats.all} відкритих` : 'Завантаження...'}</span>
                    </div>
                </div>

                <div className="sidebar-section">
                    <h3 className="section-title">Канали</h3>
                    <div className="channels-list">
                        <div
                            className={`channel-item ${activePlatform === 'all' ? 'active' : ''}`}
                            onClick={() => handlePlatformClick('all')}
                        >
                            <div className="channel-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                <i className="fa-solid fa-layer-group" />
                            </div>
                            <div className="channel-info">
                                <span className="channel-name">Всі канали</span>
                                <span className="channel-unread">{stats.all ?? '—'} відкритих</span>
                            </div>
                        </div>
                        {(Object.entries(PLATFORM_META) as [MessagingPlatform, typeof PLATFORM_META[string]][]).map(([id, meta]) => (
                            <div
                                key={id}
                                className={`channel-item ${activePlatform === id ? 'active' : ''}`}
                                onClick={() => handlePlatformClick(id)}
                            >
                                <div className="channel-icon" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                                    <i className={`fa-brands ${meta.icon}`} />
                                </div>
                                <div className="channel-info">
                                    <span className="channel-name">{meta.label}</span>
                                    <span className="channel-unread">{stats[id] !== undefined ? `${stats[id]} розмов` : '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-section chats-section">
                    <h3 className="section-title">
                        Чати{activePlatform !== 'all' ? ` · ${PLATFORM_META[activePlatform]?.label}` : ''}
                    </h3>
                    {convsError && <ErrorBanner message={convsError} onRetry={() => loadConversations(activePlatform === 'all' ? undefined : activePlatform)} />}
                    <div className="chats-list">
                        {convsLoading ? <LoadingDots /> : filteredConvs.length === 0 ? (
                            <p className="no-chats">Немає активних чатів</p>
                        ) : filteredConvs.map(conv => {
                            const meta = PLATFORM_META[conv.platform];
                            return (
                                <div
                                    key={conv.id}
                                    className={`chat-item ${activeConvId === conv.id ? 'active' : ''} ${conv.status === 'closed' ? 'closed' : ''}`}
                                    onClick={() => setActiveConvId(conv.id)}
                                >
                                    <div className="chat-avatar" style={{ position: 'relative' }}>
                                        {conv.avatarUrl
                                            ? <img src={conv.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            : getInitial(conv.contactName)
                                        }
                                        {meta && (
                                            <span style={{
                                                position: 'absolute', bottom: -2, right: -2,
                                                width: 16, height: 16, borderRadius: '50%',
                                                background: meta.color, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 9, color: 'white', border: '1.5px solid white',
                                            }}>
                                                <i className={`fa-brands ${meta.icon}`} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name-row">
                                            <span className="chat-name">{conv.contactName || conv.contactHandle || '(без імені)'}</span>
                                            <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <span className="chat-preview">{conv.lastMessageText || 'Немає повідомлень'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="inbox-chat-area">
                {activeConv ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="chat-avatar">
                                    {activeConv.avatarUrl
                                        ? <img src={activeConv.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        : getInitial(activeConv.contactName)
                                    }
                                </div>
                                <div>
                                    <h3>{activeConv.contactName || activeConv.contactHandle || '(без імені)'}</h3>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {PLATFORM_META[activeConv.platform] && (
                                            <i className={`fa-brands ${PLATFORM_META[activeConv.platform].icon}`}
                                               style={{ color: PLATFORM_META[activeConv.platform].color, fontSize: 13 }} />
                                        )}
                                        {activeConv.contactHandle || activeConv.platform}
                                        {activeConv.status === 'closed' && (
                                            <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 7px', background: '#f1f5f9', borderRadius: 20, color: '#64748b' }}>закрито</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                {activeConv.status === 'closed' ? (
                                    <button className="icon-btn" title="Відкрити розмову" onClick={() => handleOpenConversation(activeConv.id)}>
                                        <i className="fa-solid fa-lock-open" />
                                    </button>
                                ) : (
                                    <button className="icon-btn" title="Закрити розмову" onClick={async () => {
                                        await messagingApi.close(activeConv.id);
                                        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, status: 'closed' } : c));
                                        loadStats();
                                    }}>
                                        <i className="fa-solid fa-check" />
                                    </button>
                                )}
                                <button className="icon-btn" title="Оновити" onClick={() => {
                                    loadConversations(activePlatform, true);
                                    loadMessages(activeConv.id);
                                    loadStats();
                                }}>
                                    <i className={`fa-solid fa-rotate-right ${msgsLoading ? 'fa-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {msgsError && <ErrorBanner message={msgsError} onRetry={() => loadMessages(activeConv.id)} />}
                            {msgsLoading && messages.length === 0 ? <LoadingDots /> : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 }}>Ще немає повідомлень</div>
                            ) : messages.map(msg => {
                                const isMine = msg.direction === 'outbound';
                                return (
                                    <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                                        {!isMine && <div className="message-avatar">{getInitial(activeConv.contactName)}</div>}
                                        <div className="message-content">
                                            <div className="message-bubble">
                                                {msg.contentType === 'image' && msg.mediaUrl && (
                                                    <img src={msg.mediaUrl} alt="фото" style={{ maxWidth: 200, borderRadius: 8, display: 'block', marginBottom: msg.text ? 8 : 0 }} />
                                                )}
                                                {msg.contentType === 'file' && msg.mediaUrl && (
                                                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                                                       style={{ display: 'flex', alignItems: 'center', gap: 6, color: isMine ? 'rgba(255,255,255,0.9)' : '#3b82f6', fontSize: 13 }}>
                                                        <i className="fa-solid fa-file" />{msg.fileName || 'Файл'}
                                                    </a>
                                                )}
                                                {msg.contentType === 'sticker' && msg.mediaUrl && (
                                                    <img src={msg.mediaUrl} alt="стікер" style={{ width: 80 }} />
                                                )}
                                                {msg.text && <p>{msg.text}</p>}
                                            </div>
                                            <span className="message-time">
                                                {formatTime(msg.platformTimestamp)}
                                                {isMine && (
                                                    <i className={`fa-solid fa-check${msg.status === 'read' ? '-double' : ''}`}
                                                       style={{ marginLeft: 4, opacity: 0.6, fontSize: 10 }} />
                                                )}
                                            </span>
                                        </div>
                                        {isMine && <div className="message-avatar mine-avatar"><i className="fa-solid fa-user" /></div>}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {sendError && (
                            <div style={{ padding: '0 30px 8px', fontSize: 12, color: '#ef4444' }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }} />{sendError}
                            </div>
                        )}

                        <div className="chat-input-area">
                            {activeConv.status === 'closed' && (
                                <div className="closed-chat-hint">
                                    Розмова закрита. Відповідь автоматично відкриє її знову.
                                </div>
                            )}
                            <div className="input-wrapper">
                                <button className="attach-btn"><i className="fa-solid fa-paperclip" /></button>
                                <input
                                    type="text"
                                    placeholder="Введіть повідомлення..."
                                    value={messageInput}
                                    disabled={sending}
                                    onChange={e => setMessageInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                                />
                                <button className="emoji-btn"><i className="fa-regular fa-face-smile" /></button>
                                <button
                                    className="send-btn"
                                    disabled={!messageInput.trim() || sending}
                                    onClick={handleSend}
                                    style={{ opacity: (!messageInput.trim() || sending) ? 0.5 : 1 }}
                                >
                                    {sending ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat-state">
                        <div className="empty-icon"><i className="fa-regular fa-comments" /></div>
                        <h3>
                            {convsLoading ? 'Завантаження...' : conversations.length === 0 ? 'Поки немає повідомлень' : 'Оберіть чат для початку спілкування'}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
