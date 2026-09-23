import { IsString, IsOptional, MinLength } from 'class-validator';

export class ChatDto {
  @IsString()
  workspaceId: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @MinLength(1)
  message: string;
}

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
