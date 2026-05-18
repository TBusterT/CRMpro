import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { MessagingService } from '../messaging/messaging.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly messagingService: MessagingService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    try {
      const parsed = this.telegramService.parseUpdate(body);
      if (!parsed) return { ok: true };

      await this.messagingService.handleInbound({
        platform: 'telegram',
        ...parsed,
      });
    } catch (err) {
      this.logger.error('Помилка обробки Telegram webhook:', err.message);
    }
    // Telegram вимагає 200 навіть при помилці
    return { ok: true };
  }
}
