import {
  Injectable, NotFoundException, Logger, Inject, forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, MessagingPlatform } from './entities/conversation.entity';
import { Message, MessageDirection } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingEventsService } from './messaging-events.service';

export interface InboundMessagePayload {
  externalChatId: string;
  platform: MessagingPlatform;
  externalMessageId?: string;
  contactName?: string;
  contactHandle?: string;
  avatarUrl?: string;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  contentType?: string;
  platformTimestamp?: Date;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly messagingEvents: MessagingEventsService,
  ) {}

  // ─── Conversations ────────────────────────────────────────────────────────

  async findAllConversations(platform?: string, status?: string): Promise<Conversation[]> {
    const qb = this.conversationRepo
      .createQueryBuilder('conv')
      .orderBy('conv.lastMessageAt', 'DESC')
      .addOrderBy('conv.updatedAt', 'DESC');

    if (platform) qb.andWhere('conv.platform = :platform', { platform });
    if (status) qb.andWhere('conv.status = :status', { status });

    return qb.getMany();
  }

  async findConversation(id: number): Promise<Conversation> {
    const conv = await this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } } as any,
    });
    if (!conv) throw new NotFoundException(`Розмова #${id} не знайдена`);
    return conv;
  }

  async linkToClient(conversationId: number, clientId: number): Promise<Conversation> {
    const conv = await this.findConversation(conversationId);
    conv.clientId = clientId;
    return this.conversationRepo.save(conv);
  }

  async closeConversation(id: number): Promise<Conversation> {
    const conv = await this.findConversation(id);
    conv.status = 'closed';
    return this.conversationRepo.save(conv);
  }

  async openConversation(id: number): Promise<Conversation> {
    const conv = await this.findConversation(id);
    conv.status = 'open';
    return this.conversationRepo.save(conv);
  }

  // ─── Inbound (з платформи → CRM) ─────────────────────────────────────────

  async handleInbound(payload: InboundMessagePayload): Promise<Message> {
    // Знайти або створити розмову
    let conv = await this.conversationRepo.findOne({
      where: {
        externalChatId: payload.externalChatId,
        platform: payload.platform,
      },
    });

    if (!conv) {
      conv = this.conversationRepo.create({
        externalChatId: payload.externalChatId,
        platform: payload.platform,
        contactName: payload.contactName,
        contactHandle: payload.contactHandle,
        avatarUrl: payload.avatarUrl,
        status: 'open',
      });
      await this.conversationRepo.save(conv);
      this.logger.log(`Нова розмова [${payload.platform}] від ${payload.contactName || payload.externalChatId}`);
    } else {
      // Оновити ім'я якщо змінилось і автоматично відкрити чат,
      // коли користувач написав нове повідомлення після закриття розмови.
      if (payload.contactName) conv.contactName = payload.contactName;
      if (payload.contactHandle) conv.contactHandle = payload.contactHandle;
      if (payload.avatarUrl) conv.avatarUrl = payload.avatarUrl;
      if (conv.status === 'closed') conv.status = 'open';
    }

    // Зберегти повідомлення
    const message = this.messageRepo.create({
      conversationId: conv.id,
      externalMessageId: payload.externalMessageId,
      direction: 'inbound' as MessageDirection,
      contentType: (payload.contentType as any) || 'text',
      text: payload.text,
      mediaUrl: payload.mediaUrl,
      fileName: payload.fileName,
      platformTimestamp: payload.platformTimestamp || new Date(),
      status: 'delivered',
    });
    await this.messageRepo.save(message);

    // Оновити snapshot останнього повідомлення й статус розмови.
    conv.lastMessageText = payload.text || `[${payload.contentType || 'медіа'}]`;
    conv.lastMessageAt = message.platformTimestamp;
    conv.status = 'open';
    conv = await this.conversationRepo.save(conv);
    this.messagingEvents.emitMessageCreated(message, conv);

    return message;
  }

  // ─── Outbound (з CRM → платформу) ────────────────────────────────────────

  async saveOutbound(
    conversationId: number,
    text: string,
    externalMessageId?: string,
    sentByUserId?: number,
  ): Promise<Message> {
    const message = this.messageRepo.create({
      conversationId,
      direction: 'outbound',
      contentType: 'text',
      text,
      externalMessageId,
      sentByUserId,
      status: 'sent',
      platformTimestamp: new Date(),
    });
    await this.messageRepo.save(message);

    // Оновити snapshot і відкрити розмову, якщо менеджер відповідає у закритий чат.
    await this.conversationRepo.update(conversationId, {
      status: 'open',
      lastMessageText: text,
      lastMessageAt: new Date(),
    });

    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    this.messagingEvents.emitMessageCreated(message, conversation);

    return message;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(conversationId: number): Promise<Message[]> {
    await this.findConversation(conversationId); // перевірка існування
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getStats() {
    const total = await this.conversationRepo.count();
    const open = await this.conversationRepo.count({ where: { status: 'open' } });
    const pending = await this.conversationRepo.count({ where: { status: 'pending' } });
    const byPlatform = await this.conversationRepo
      .createQueryBuilder('conv')
      .select('conv.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .groupBy('conv.platform')
      .getRawMany();

    return { total, open, pending, closed: Math.max(total - open - pending, 0), byPlatform };
  }
}
