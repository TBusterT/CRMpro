import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingEventsService } from './messaging-events.service';
import { TelegramModule } from '../telegram/telegram.module';
import { ViberModule } from '../viber/viber.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    TelegramModule,
    ViberModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingEventsService],
  exports: [MessagingService, MessagingEventsService],
})
export class MessagingModule {}
