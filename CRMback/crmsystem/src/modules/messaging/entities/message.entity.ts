import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageContentType = 'text' | 'image' | 'file' | 'sticker' | 'location' | 'contact';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: number;

  /** ID повідомлення у самій платформі */
  @Column({ nullable: true })
  externalMessageId: string;

  @Column({ type: 'varchar' })
  direction: MessageDirection;

  @Column({ type: 'varchar', default: 'text' })
  contentType: MessageContentType;

  @Column({ type: 'text', nullable: true })
  text: string;

  /** URL медіафайлу (фото, документ тощо) */
  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ type: 'varchar', default: 'sent' })
  status: MessageStatus;

  /** Для outbound: ID менеджера який надіслав */
  @Column({ nullable: true })
  sentByUserId: number;

  /** Timestamp з платформи */
  @Column({ nullable: true })
  platformTimestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
