import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';  // ← імпорт звідси
import axios from 'axios';


@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private token: string;
  private apiUrl: string;

  constructor(private readonly configService: ConfigService) {}  // ← інжектуємо


  async onModuleInit() {
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
    this.apiUrl = `https://api.telegram.org/bot${this.token}`;

    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задано — Telegram вимкнено');
      return;
    }
    await this.setWebhook();
  }

  private async setWebhook() {
    const webhookUrl = process.env.WEBHOOK_BASE_URL;
    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_BASE_URL не задано — webhook Telegram не встановлено');
      return;
    }

    try {
      const url = `${webhookUrl}/telegram/webhook`;
      const res = await axios.post(`${this.apiUrl}/setWebhook`, { url });
      if (res.data.ok) {
        this.logger.log(`Telegram webhook встановлено: ${url}`);
      } else {
        this.logger.error('Не вдалось встановити webhook:', res.data.description);
      }
    } catch (err) {
      this.logger.error('Помилка setWebhook:', err.message);
    }
  }

  /**
   * Надіслати текстове повідомлення в чат.
   * Повертає message_id з Telegram.
   */
  async sendMessage(chatId: string, text: string): Promise<string | undefined> {
    if (!this.token) return undefined;
    try {
      const res = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      });
      return String(res.data.result?.message_id);
    } catch (err) {
      this.logger.error(`Помилка sendMessage (chat ${chatId}):`, err.response?.data || err.message);
      return undefined;
    }
  }

  /**
   * Парсинг вхідного update від Telegram.
   * Підтримує текст, фото, документи, стікери.
   */
  parseUpdate(body: any): {
    externalChatId: string;
    externalMessageId: string;
    contactName: string;
    contactHandle: string;
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    contentType: string;
    platformTimestamp: Date;
  } | null {
    const msg = body?.message || body?.edited_message || body?.channel_post;
    if (!msg) return null;

    const chat = msg.chat;
    const from = msg.from || {};
    const firstName = from.first_name || '';
    const lastName = from.last_name || '';
    const contactName = [firstName, lastName].filter(Boolean).join(' ') || chat.title || 'Невідомий';
    const contactHandle = from.username ? `@${from.username}` : String(from.id || '');

    let text: string | undefined;
    let mediaUrl: string | undefined;
    let fileName: string | undefined;
    let contentType = 'text';

    if (msg.text) {
      text = msg.text;
      contentType = 'text';
    } else if (msg.photo) {
      // беремо найбільше фото
      const photo = msg.photo[msg.photo.length - 1];
      mediaUrl = `https://api.telegram.org/bot${this.token}/getFile?file_id=${photo.file_id}`;
      text = msg.caption;
      contentType = 'image';
    } else if (msg.document) {
      mediaUrl = `https://api.telegram.org/bot${this.token}/getFile?file_id=${msg.document.file_id}`;
      fileName = msg.document.file_name;
      text = msg.caption;
      contentType = 'file';
    } else if (msg.sticker) {
      mediaUrl = `https://api.telegram.org/bot${this.token}/getFile?file_id=${msg.sticker.file_id}`;
      contentType = 'sticker';
    } else if (msg.location) {
      text = `📍 ${msg.location.latitude}, ${msg.location.longitude}`;
      contentType = 'location';
    } else if (msg.contact) {
      text = `📞 ${msg.contact.first_name} ${msg.contact.phone_number}`;
      contentType = 'contact';
    } else {
      text = '[непідтримуваний тип повідомлення]';
    }

    return {
      externalChatId: String(chat.id),
      externalMessageId: String(msg.message_id),
      contactName,
      contactHandle,
      text,
      mediaUrl,
      fileName,
      contentType,
      platformTimestamp: new Date(msg.date * 1000),
    };
  }
}
