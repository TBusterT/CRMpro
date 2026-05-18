import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { ViberModule } from './modules/viber/viber.module';

import { Client } from './modules/clients/entities/client.entity';
import { Finance } from './modules/finance/entities/finance.entity';
import { Product } from './modules/inventory/entities/inventory.entity';
import { Conversation } from './modules/messaging/entities/conversation.entity';
import { Message } from './modules/messaging/entities/message.entity';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'CRMproTop@',
      database: process.env.DB_NAME || 'crmsystem',
      entities: [Client, Finance, Product, Conversation, Message, User],
      synchronize: true,
    }),

    UsersModule,
    AuthModule,
    ClientsModule,
    FinanceModule,
    InventoryModule,
    MessagingModule,
    TelegramModule,
    ViberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}