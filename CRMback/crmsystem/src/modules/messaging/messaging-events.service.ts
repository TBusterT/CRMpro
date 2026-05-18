import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

export type MessagingRealtimeEvent =
  | {
      type: 'message_created';
      conversationId: number;
      message: Message;
      conversation?: Conversation | null;
    }
  | {
      type: 'conversation_updated';
      conversationId: number;
      conversation: Conversation;
    };

@Injectable()
export class MessagingEventsService {
  private readonly events$ = new Subject<MessagingRealtimeEvent>();

  stream(): Observable<MessageEvent> {
    return this.events$.pipe(map((data) => ({ data })));
  }

  emitMessageCreated(message: Message, conversation?: Conversation | null) {
    this.events$.next({
      type: 'message_created',
      conversationId: message.conversationId,
      message,
      conversation,
    });
  }

  emitConversationUpdated(conversation: Conversation) {
    this.events$.next({
      type: 'conversation_updated',
      conversationId: conversation.id,
      conversation,
    });
  }
}
