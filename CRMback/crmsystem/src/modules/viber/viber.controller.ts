import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ViberService } from './viber.service';
import { MessagingService } from '../messaging/messaging.service';

@Controller('viber')
export class ViberController {
  private readonly logger = new Logger(ViberController.name);

  constructor(
    private readonly viberService: ViberService,
    private readonly messagingService: MessagingService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    try {
      // Viber надсилає ping при реєстрації webhook
      if (body.event === 'webhook') {
        this.logger.log('Viber webhook підтверджено');
        return { status: 0 };
      }

      const parsed = this.viberService.parseEvent(body);
      if (!parsed) return { status: 0 };

      await this.messagingService.handleInbound({
        platform: 'viber',
        ...parsed,
      });
    } catch (err) {
      this.logger.error('Помилка обробки Viber webhook:', err.message);
    }

    return { status: 0 };
  }
}
