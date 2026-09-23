import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { RagService } from '../rag/rag.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { TaskType } from '@google/generative-ai';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { ToolExecutorService } from '../tools/tool-executor.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    private ragService: RagService,
    private embeddingsService: EmbeddingsService,
    private toolRegistry: ToolRegistryService,
    private toolExecutor: ToolExecutorService,
  ) {}

  async chat(userId: string, workspaceId: string, conversationId: string | null, message: string) {
    // 1. Verify workspace ownership
    await this.workspacesService.validateOwnership(workspaceId, userId);

    // 2. Get or create conversation
    let conversation: any;
    if (conversationId) {
      conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || conversation.workspaceId !== workspaceId || conversation.userId !== userId) {
        throw new NotFoundException('Conversation not found or access denied');
      }
    } else {
      conversation = await this.prisma.conversation.create({
        data: {
          workspaceId,
          userId,
          title: message.substring(0, 80),
        },
      });
    }

    // 3. Store user message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // 4. Get conversation history (last 10 messages for context)
    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    // Exclude the message we just created for the chat history sent to Gemini
    const historyForGemini = history.slice(0, -1).map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      content: msg.content,
    }));

    // 5. Generate query embedding
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embeddingsService.generateEmbedding(message, TaskType.RETRIEVAL_QUERY);
    } catch (error: any) {
      this.logger.error(`Embedding generation failed: ${error.message}`);
      throw new Error('Failed to process your question. Please try again.');
    }

    // 6. Search similar chunks (WORKSPACE-FILTERED inside SQL)
    const chunks = await this.ragService.searchSimilarChunks(workspaceId, queryEmbedding);

    // 7. Build context from retrieved chunks
    const context = this.ragService.buildContext(chunks);

    // 8. Get tool declarations
    const tools = this.toolRegistry.getToolDeclarations();

    // 9. Call Gemini with RAG context and tools
    let result: any;
    try {
      result = await this.ragService.generateAnswer(message, context, historyForGemini, tools);
    } catch (error: any) {
      this.logger.error(`Gemini API call failed: ${error.message}`);
      // Store error message and return gracefully
      const errorMsg = 'I apologize, but I encountered an error processing your request. Please try again.';
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: errorMsg,
        },
      });
      return {
        answer: errorMsg,
        citations: [],
        conversationId: conversation.id,
        retrievalContext: chunks,
        toolCalls: [],
      };
    }

    let answerText = '';
    const executedToolCalls: any[] = [];

    // 10. Handle tool-call loop
    try {
      const functionCalls = result.response.functionCalls?.() || [];
      
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          const toolContext = { userId, workspaceId, conversationId: conversation.id };
          
          if (!this.toolRegistry.isValidTool(call.name)) {
            executedToolCalls.push({
              name: call.name,
              status: 'FAILED',
              error: `Unknown tool: ${call.name}`,
            });
            continue;
          }

          const toolResult = await this.toolExecutor.executeTool(call.name, call.args, toolContext);
          executedToolCalls.push({
            name: call.name,
            args: call.args,
            status: toolResult.success ? 'SUCCESS' : 'FAILED',
            result: toolResult,
          });
        }

        // Feed tool results back to Gemini for a natural language response
        const toolSummary = executedToolCalls.map(tc => {
          if (tc.status === 'SUCCESS') {
            return `Tool "${tc.name}" executed successfully. Result: ${JSON.stringify(tc.result)}`;
          }
          return `Tool "${tc.name}" failed: ${tc.error || tc.result?.error}`;
        }).join('\n');

        try {
          const followUp = await this.ragService.generateAnswer(
            `The following tools were executed based on the user's request:\n${toolSummary}\n\nPlease provide a natural language summary of what was done.`,
            context,
            [...historyForGemini, { role: 'user', content: message }],
            [],
          );
          answerText = followUp.answer;
        } catch {
          answerText = executedToolCalls.map(tc => {
            if (tc.status === 'SUCCESS') {
              return `✓ ${tc.name} executed successfully.`;
            }
            return `✗ ${tc.name} failed: ${tc.error || tc.result?.error}`;
          }).join('\n');
        }
      } else {
        answerText = result.answer;
      }
    } catch (error: any) {
      this.logger.error(`Tool processing error: ${error.message}`);
      answerText = result.answer || 'I encountered an error while processing tool calls.';
    }

    // 11. Parse citations from chunks
    const citations = chunks
      .filter((chunk: any) => chunk.similarity > 0.3)
      .map((chunk: any) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        page: chunk.pageNumber,
        chunkId: chunk.id,
        content: chunk.content?.substring(0, 200),
        similarity: parseFloat(Number(chunk.similarity).toFixed(4)),
      }));

    // 12. Store assistant message with citations and retrieval context
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: answerText,
        citations: citations.length > 0 ? citations : undefined,
        toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
        retrievalContext: chunks.map((c: any) => ({
          id: c.id,
          documentId: c.documentId,
          documentName: c.documentName,
          page: c.pageNumber,
          chunkIndex: c.chunkIndex,
          content: c.content?.substring(0, 300),
          similarity: parseFloat(Number(c.similarity).toFixed(4)),
        })),
      },
    });

    // 13. Update conversation title if it's a new conversation
    if (!conversationId) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: message.substring(0, 80) },
      });
    }

    return {
      answer: answerText,
      citations,
      conversationId: conversation.id,
      retrievalContext: chunks.map((c: any) => ({
        id: c.id,
        documentId: c.documentId,
        documentName: c.documentName,
        page: c.pageNumber,
        chunkIndex: c.chunkIndex,
        content: c.content?.substring(0, 300),
        similarity: parseFloat(Number(c.similarity).toFixed(4)),
      })),
      toolCalls: executedToolCalls,
    };
  }

  async getConversations(userId: string, workspaceId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    return this.prisma.conversation.findMany({
      where: { workspaceId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string, workspaceId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.workspaceId !== workspaceId || conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createConversation(userId: string, workspaceId: string, title?: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    return this.prisma.conversation.create({
      data: {
        workspaceId,
        userId,
        title: title || 'New Conversation',
      },
    });
  }
}
