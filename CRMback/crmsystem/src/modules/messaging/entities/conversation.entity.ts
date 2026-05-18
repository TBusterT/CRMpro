import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

export type MessagingPlatform = 'telegram' | 'viber' | 'whatsapp';
export type ConversationStatus = 'open' | 'closed' | 'pending';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  /** Унікальний ID чату у відповідній платформі */
  @Column()
  externalChatId: string;

  @Column({ type: 'varchar' })
  platform: MessagingPlatform;

  /** Ім'я контакту з платформи */
  @Column({ nullable: true })
  contactName: string;

  /** Username / phone */
  @Column({ nullable: true })
  contactHandle: string;

  /** Аватар (URL або base64) */
  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: 'open' })
  status: ConversationStatus;

  /** ID клієнта в CRM (якщо вже прив'язаний) */
  @Column({ nullable: true })
  clientId: number;

  @Column({ nullable: true })
  lastMessageText: string;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @OneToMany(() => Message, (msg) => msg.conversation, { cascade: true })
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
