import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ViberService implements OnModuleInit {
  private readonly logger = new Logger(ViberService.name);
  private readonly token: string = process.env.VIBER_BOT_TOKEN || '';
  private readonly apiUrl = 'https://chatapi.viber.com/pa';

  async onModuleInit() {
    if (!this.token) {
      this.logger.warn('VIBER_BOT_TOKEN не задано — Viber вимкнено');
      return;
    }
    await this.setWebhook();
  }

  private async setWebhook() {
    const webhookUrl = process.env.WEBHOOK_BASE_URL;
    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_BASE_URL не задано — webhook Viber не встановлено');
      return;
    }

    try {
      const url = `${webhookUrl}/viber/webhook`;
      const res = await axios.post(
        `${this.apiUrl}/set_webhook`,
        {
          url,
          event_types: ['message', 'delivered', 'seen', 'failed', 'subscribed', 'unsubscribed'],
          send_name: true,
          send_photo: true,
        },
        { headers: { 'X-Viber-Auth-Token': this.token } },
      );

      if (res.data.status === 0) {
        this.logger.log(`Viber webhook встановлено: ${url}`);
      } else {
        this.logger.error('Viber webhook помилка:', res.data.status_message);
      }
    } catch (err) {
      this.logger.error('Помилка setWebhook Viber:', err.message);
    }
  }

  /**
   * Надіслати текстове повідомлення користувачу Viber.
   * Повертає message_token з Viber API.
   */
  async sendMessage(viberId: string, text: string): Promise<string | undefined> {
    if (!this.token) return undefined;
    try {
      const res = await axios.post(
        `${this.apiUrl}/send_message`,
        {
          receiver: viberId,
          type: 'text',
          text,
          sender: {
            name: process.env.VIBER_BOT_NAME || 'CRM Support',
          },
          min_api_version: 1,
        },
        { headers: { 'X-Viber-Auth-Token': this.token } },
      );
      return String(res.data.message_token);
    } catch (err) {
      this.logger.error(`Viber sendMessage (${viberId}):`, err.response?.data || err.message);
      return undefined;
    }
  }

  /**
   * Парсинг Viber callback event.
   * Підтримує text, picture, file, sticker, location, contact.
   */
  parseEvent(body: any): {
    externalChatId: string;
    externalMessageId: string;
    contactName: string;
    contactHandle: string;
    avatarUrl?: string;
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    contentType: string;
    platformTimestamp: Date;
  } | null {
    // Пропускаємо службові події (delivered, seen тощо)
    if (body.event !== 'message') return null;

    const sender = body.sender || {};
    const msg = body.message || {};

    let text: string | undefined;
    let mediaUrl: string | undefined;
    let fileName: string | undefined;
    let contentType = 'text';

    switch (msg.type) {
      case 'text':
        text = msg.text;
        contentType = 'text';
        break;
      case 'picture':
        mediaUrl = msg.media;
        text = msg.text; // caption
        contentType = 'image';
        break;
      case 'video':
      case 'file':
        mediaUrl = msg.media;
        fileName = msg.file_name;
        contentType = 'file';
        break;
      case 'sticker':
        mediaUrl = `https://stickers.viber.com/${msg.sticker_id}/200/sticker.png`;
        contentType = 'sticker';
        break;
      case 'location':
        text = `📍 ${msg.location?.lat}, ${msg.location?.lon}`;
        contentType = 'location';
        break;
      case 'contact':
        text = `📞 ${msg.contact?.name} ${msg.contact?.phone_number}`;
        contentType = 'contact';
        break;
      default:
        text = '[непідтримуваний тип повідомлення]';
    }

    return {
      externalChatId: sender.id,
      externalMessageId: String(body.message_token),
      contactName: sender.name || 'Невідомий',
      contactHandle: sender.id,
      avatarUrl: sender.avatar,
      text,
      mediaUrl,
      fileName,
      contentType,
      platformTimestamp: new Date(body.timestamp),
    };
  }
}
