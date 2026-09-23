import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

@Injectable()
export class EmbeddingsService {
  private genAI: GoogleGenerativeAI;
  private modelName = 'gemini-embedding-2';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async generateEmbedding(text: string, taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      taskType: taskType,
      outputDimensionality: 768,
    } as any);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[], taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const requests = batch.map((text) => ({
        content: { role: 'user', parts: [{ text }] },
        taskType: taskType,
        outputDimensionality: 768,
      } as any));
      
      const result = await model.batchEmbedContents({ requests });
      allEmbeddings.push(...result.embeddings.map(e => e.values));
    }

    return allEmbeddings;
  }
}
