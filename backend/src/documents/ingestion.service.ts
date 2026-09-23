import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { v4 as uuidv4 } from 'uuid';
import { TaskType } from '@google/generative-ai';

const pdfParse = require('pdf-parse-new');

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingsService: EmbeddingsService,
  ) {}

  async processDocument(documentId: string, workspaceId: string, file: Express.Multer.File) {
    try {
      this.logger.log(`Starting ingestion for document ${documentId}`);
      
      let textContent = '';
      const pagesInfo: { text: string; pageNumber: number }[] = [];

      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        textContent = data.text;
        // Approximation of pages since pdf-parse doesn't perfectly segment text per page natively in all cases
        // We'll treat the whole text as single block if pages info isn't nicely split by pdf-parse
        pagesInfo.push({ text: textContent, pageNumber: 1 });
      } else {
        textContent = file.buffer.toString('utf8');
        pagesInfo.push({ text: textContent, pageNumber: 1 });
      }

      const chunks = this.splitIntoChunks(pagesInfo);

      const textsToEmbed = chunks.map(c => c.content);
      const embeddings = await this.embeddingsService.generateEmbeddings(textsToEmbed, TaskType.RETRIEVAL_DOCUMENT);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingArray = embeddings[i];
        const embeddingString = `[${embeddingArray.join(',')}]`;
        const id = uuidv4();

        await this.prisma.$executeRaw`
          INSERT INTO document_chunks (id, document_id, workspace_id, chunk_index, content, page_number, embedding, created_at)
          VALUES (${id}, ${documentId}, ${workspaceId}, ${chunk.chunkIndex}, ${chunk.content}, ${chunk.pageNumber}, ${embeddingString}::vector, NOW())
        `;
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(`Completed ingestion for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed ingestion for document ${documentId}`, error);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    }
  }

  private splitIntoChunks(pages: { text: string; pageNumber: number }[]) {
    const chunks: { content: string; pageNumber: number; chunkIndex: number }[] = [];
    let chunkIndex = 0;
    const targetTokenLength = 600;
    const charToTokenRatio = 4;
    const targetCharLength = targetTokenLength * charToTokenRatio;
    const overlapCharLength = 100 * charToTokenRatio;

    for (const page of pages) {
      const text = page.text;
      let startIndex = 0;
      
      while (startIndex < text.length) {
        let endIndex = startIndex + targetCharLength;
        
        if (endIndex < text.length) {
          const nextSpace = text.indexOf(' ', endIndex);
          if (nextSpace !== -1 && nextSpace - endIndex < 100) {
            endIndex = nextSpace;
          }
        } else {
          endIndex = text.length;
        }

        const content = text.slice(startIndex, endIndex).trim();
        if (content.length > 0) {
          chunks.push({ content, pageNumber: page.pageNumber, chunkIndex: chunkIndex++ });
        }

        startIndex = endIndex - overlapCharLength;
        if (startIndex < 0) startIndex = 0;
        if (endIndex >= text.length) break;
      }
    }

    return chunks;
  }
}
