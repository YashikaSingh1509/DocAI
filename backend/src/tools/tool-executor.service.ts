import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

interface ToolContext {
  userId: string;
  workspaceId: string;
  conversationId: string;
}

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async executeTool(name: string, args: any, context: ToolContext) {
    this.logger.log(`Executing tool ${name} for workspace ${context.workspaceId}`);
    
    let result: any = null;
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | null = null;

    try {
      if (name === 'save_task') {
        result = await this.executeSaveTask(args, context);
      } else if (name === 'send_notification') {
        result = await this.executeSendNotification(args, context);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    } catch (e: any) {
      status = 'FAILED';
      errorMessage = e.message;
      this.logger.error(`Tool execution failed: ${e.message}`);
    }

    // Log the tool call
    await this.prisma.toolCall.create({
      data: {
        toolName: name,
        arguments: args || {},
        result: result || {},
        status,
        error: errorMessage,
        workspaceId: context.workspaceId,
        userId: context.userId,
        conversationId: context.conversationId,
      },
    });
    
    if (status === 'FAILED') {
      return { success: false, error: errorMessage };
    }
    
    return { success: true, ...result };
  }

  private async executeSaveTask(args: any, context: ToolContext) {
    if (!args.title) {
      throw new Error('Title is required for save_task');
    }

    const task = await this.prisma.task.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        title: args.title,
        description: args.description || null,
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        status: 'PENDING',
      },
    });

    return { taskId: task.id, title: task.title, status: 'created' };
  }

  private async executeSendNotification(args: any, context: ToolContext) {
    if (!args.message) {
      throw new Error('Message is required for send_notification');
    }

    const webhookUrl = this.configService.get('SLACK_WEBHOOK_URL') || 
                       this.configService.get('DISCORD_WEBHOOK_URL');
    
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: args.message,
            content: args.message,  // Discord format
          }),
        });
        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}`);
        }
        return { sent: true, platform: 'webhook', message: args.message };
      } catch (e: any) {
        throw new Error(`Failed to send webhook notification: ${e.message}`);
      }
    }

    // Dev mode mock
    this.logger.log(`[MOCK NOTIFICATION] ${args.message}`);
    return { sent: true, platform: 'mock (no webhook configured)', message: args.message };
  }
}
