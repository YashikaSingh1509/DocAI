import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto, CreateConversationDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  chat(@CurrentUser() user: any, @Body() chatDto: ChatDto) {
    return this.chatService.chat(user.id, chatDto.workspaceId, chatDto.conversationId || null, chatDto.message);
  }

  @Get('workspaces/:workspaceId/conversations')
  getConversations(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.chatService.getConversations(user.id, workspaceId);
  }

  @Post('workspaces/:workspaceId/conversations')
  createConversation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto
  ) {
    return this.chatService.createConversation(user.id, workspaceId, dto.title);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any
  ) {
    return this.chatService.getMessages(id, user.id, workspaceId);
  }
}
