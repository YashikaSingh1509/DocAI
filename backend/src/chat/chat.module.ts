import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { RagModule } from '../rag/rag.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [WorkspacesModule, RagModule, EmbeddingsModule, ToolsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
