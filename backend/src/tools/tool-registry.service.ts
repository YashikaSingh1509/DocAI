import { Injectable } from '@nestjs/common';
import { SchemaType, FunctionDeclaration } from '@google/generative-ai';

@Injectable()
export class ToolRegistryService {
  private readonly tools = new Map<string, FunctionDeclaration>();

  constructor() {
    this.tools.set('save_task', {
      name: 'save_task',
      description: 'Save a task or action item extracted from the conversation or document.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: 'The title or brief summary of the task',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Detailed description of the task',
          },
        },
        required: ['title'],
      },
    });

    this.tools.set('send_notification', {
      name: 'send_notification',
      description: 'Send a notification message to the team (e.g. Slack/Discord).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          message: {
            type: SchemaType.STRING,
            description: 'The notification message to send',
          },
        },
        required: ['message'],
      },
    });
  }

  getToolDeclarations(): FunctionDeclaration[] {
    return Array.from(this.tools.values());
  }

  isValidTool(name: string): boolean {
    return this.tools.has(name);
  }
}
