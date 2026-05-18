# Модуль месенджерів (Messaging)

Двостороннє спілкування з клієнтами через Telegram і Viber прямо з CRM.

---

## Архітектура

```
Клієнт (Telegram/Viber)
        │  webhook POST
        ▼
/telegram/webhook  або  /viber/webhook
        │
        ▼
TelegramService.parseUpdate()  /  ViberService.parseEvent()
        │
        ▼
MessagingService.handleInbound()
        │  зберігає в БД
        ▼
conversations + messages (PostgreSQL)
        │
        ▼
GET /messaging/conversations  ← CRM frontend

Менеджер → POST /messaging/send
        │
        ▼
TelegramService.sendMessage() / ViberService.sendMessage()
        │
        ▼
Клієнт отримує відповідь
```

---

## Налаштування

### 1. Скопіюй `.env.example` → `.env` і заповни токени

```bash
cp .env.example .env
```

### 2. Telegram Bot

1. Напиши @BotFather у Telegram → `/newbot`
2. Скопіюй токен у `TELEGRAM_BOT_TOKEN`
3. Webhook встановлюється **автоматично** при старті сервера

### 3. Viber Bot

1. Зайди на https://partners.viber.com → "Create Bot Account"
2. Скопіюй Auth Token у `VIBER_BOT_TOKEN`
3. Webhook встановлюється **автоматично** при старті сервера

### 4. Публічна URL (для локальної розробки)

Telegram і Viber вимагають HTTPS-адресу. Для локальної розробки використовуй [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Скопіюй HTTPS URL в WEBHOOK_BASE_URL у .env
# Приклад: WEBHOOK_BASE_URL=https://abc123.ngrok.io
```

### 5. Встанови залежність `@nestjs/config`

```bash
npm install @nestjs/config
```

---

## API Endpoints

### Розмови

| Метод | URL | Опис |
|-------|-----|------|
| `GET` | `/messaging/conversations` | Список усіх розмов |
| `GET` | `/messaging/conversations?platform=telegram` | Фільтр по платформі |
| `GET` | `/messaging/conversations?status=open` | Фільтр по статусу |
| `GET` | `/messaging/conversations/:id` | Деталі + повідомлення |
| `GET` | `/messaging/conversations/:id/messages` | Тільки повідомлення |
| `PATCH` | `/messaging/conversations/:id/close` | Закрити розмову |
| `PATCH` | `/messaging/conversations/:id/link-client` | Прив'язати до клієнта CRM |
| `GET` | `/messaging/stats` | Статистика по платформах |

### Відправка

| Метод | URL | Body | Опис |
|-------|-----|------|------|
| `POST` | `/messaging/send` | `{ conversationId, text, sentByUserId? }` | Відповісти клієнту |

### Webhook приймачі (внутрішні)

| Метод | URL | Опис |
|-------|-----|------|
| `POST` | `/telegram/webhook` | Приймає update від Telegram |
| `POST` | `/viber/webhook` | Приймає event від Viber |

---

## Структура БД

### `conversations`
| Поле | Тип | Опис |
|------|-----|------|
| `externalChatId` | string | ID чату в платформі |
| `platform` | enum | `telegram` / `viber` / `whatsapp` |
| `contactName` | string | Ім'я контакту |
| `contactHandle` | string | @username або phone |
| `status` | enum | `open` / `closed` / `pending` |
| `clientId` | number? | ID клієнта CRM (якщо прив'язано) |
| `lastMessageText` | string | Превью останнього повідомлення |

### `messages`
| Поле | Тип | Опис |
|------|-----|------|
| `direction` | enum | `inbound` / `outbound` |
| `contentType` | enum | `text` / `image` / `file` / `sticker` / `location` / `contact` |
| `text` | string? | Текст повідомлення |
| `mediaUrl` | string? | URL медіафайлу |
| `status` | enum | `sent` / `delivered` / `read` / `failed` |
| `sentByUserId` | number? | Менеджер, що надіслав (для outbound) |

---

## WhatsApp (майбутнє)

Коли визначишся з варіантом:
- **Business API (Meta)** — додати `WhatsAppModule` аналогічно Viber (webhook + sendMessage через Graph API)
- **Неофіційний** — `whatsapp-web.js` + окремий мікросервіс (є ризики бану номера)
