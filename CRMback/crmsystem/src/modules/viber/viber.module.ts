import { Module, forwardRef } from '@nestjs/common';
import { ViberService } from './viber.service';
import { ViberController } from './viber.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [forwardRef(() => MessagingModule)],
  controllers: [ViberController],
  providers: [ViberService],
  exports: [ViberService],
})
export class ViberModule {}
