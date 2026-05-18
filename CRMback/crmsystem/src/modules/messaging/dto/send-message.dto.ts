import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsNumber()
  sentByUserId?: number;
}
