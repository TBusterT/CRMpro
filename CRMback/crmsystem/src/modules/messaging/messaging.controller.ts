import {
  Controller, Get, Post, Patch, Param, Body,
  Query, ParseIntPipe, Sse, MessageEvent,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TelegramService } from '../telegram/telegram.service';
import { ViberService } from '../viber/viber.service';
import { MessagingEventsService } from './messaging-events.service';
import { Observable } from 'rxjs';

@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly telegramService: TelegramService,
    private readonly viberService: ViberService,
    private readonly messagingEvents: MessagingEventsService,
  ) {}


  /** Real-time stream для Inbox через Server-Sent Events */
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.messagingEvents.stream();
  }

  /** Список усіх розмов (з фільтром по платформі/статусу) */
  @Get('conversations')
  findAll(
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.messagingService.findAllConversations(platform, status);
  }

  /** Деталі розмови + всі повідомлення */
  @Get('conversations/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messagingService.findConversation(id);
  }

  /** Повідомлення окремо (для lazy-load) */
  @Get('conversations/:id/messages')
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.messagingService.getMessages(id);
  }

  /** Надіслати відповідь з CRM на платформу */
  @Post('send')
  async send(@Body() dto: SendMessageDto) {
    const conv = await this.messagingService.findConversation(dto.conversationId);

    let externalId: string | undefined;

    if (conv.platform === 'telegram') {
      externalId = await this.telegramService.sendMessage(
        conv.externalChatId,
        dto.text,
      );
    } else if (conv.platform === 'viber') {
      externalId = await this.viberService.sendMessage(
        conv.externalChatId,
        dto.text,
      );
    }

    return this.messagingService.saveOutbound(
      dto.conversationId,
      dto.text,
      externalId,
      dto.sentByUserId,
    );
  }

  /** Прив'язати розмову до клієнта CRM */
  @Patch('conversations/:id/link-client')
  linkClient(
    @Param('id', ParseIntPipe) id: number,
    @Body('clientId', ParseIntPipe) clientId: number,
  ) {
    return this.messagingService.linkToClient(id, clientId);
  }

  /** Закрити розмову */
  @Patch('conversations/:id/close')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.messagingService.closeConversation(id);
  }

  /** Знову відкрити розмову */
  @Patch('conversations/:id/open')
  open(@Param('id', ParseIntPipe) id: number) {
    return this.messagingService.openConversation(id);
  }

  /** Статистика по платформах */
  @Get('stats')
  stats() {
    return this.messagingService.getStats();
  }
}
