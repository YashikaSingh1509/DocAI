import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { DocumentsModule } from './documents/documents.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { RagModule } from './rag/rag.module';
import { ChatModule } from './chat/chat.module';
import { ToolsModule } from './tools/tools.module';
import { TasksModule } from './tasks/tasks.module';
import { ToolCallsModule } from './tool-calls/tool-calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    DatabaseModule,
    AuthModule,
    WorkspacesModule,
    DocumentsModule,
    EmbeddingsModule,
    RagModule,
    ChatModule,
    ToolsModule,
    TasksModule,
    ToolCallsModule,
  ],
})
export class AppModule {}
