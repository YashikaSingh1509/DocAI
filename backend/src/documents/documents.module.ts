import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { IngestionService } from './ingestion.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [WorkspacesModule, EmbeddingsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, IngestionService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
