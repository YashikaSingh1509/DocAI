import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { IngestionService } from './ingestion.service';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    private ingestionService: IngestionService,
  ) {}

  async upload(workspaceId: string, userId: string, file: Express.Multer.File) {
    await this.workspacesService.validateOwnership(workspaceId, userId);

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: PDF, TXT, Markdown`);
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Maximum size: 20 MB`);
    }

    // Calculate content hash
    const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Check for duplicates
    const existingDoc = await this.prisma.document.findUnique({
      where: {
        workspaceId_contentHash: {
          workspaceId,
          contentHash,
        },
      },
    });

    if (existingDoc) {
      throw new ConflictException('Document already exists in this workspace.');
    }

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        workspaceId,
        filename: file.originalname,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        contentHash,
        status: 'PROCESSING',
      },
    });

    // Fire and forget ingestion
    this.ingestionService.processDocument(document.id, workspaceId, file).catch((err) => {
      console.error(`Ingestion failed for document ${document.id}:`, err.message);
    });

    return document;
  }

  async findAllByWorkspace(workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    return this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    const doc = await this.prisma.document.findFirst({
      where: { id, workspaceId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string, workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    await this.findOne(id, workspaceId, userId);

    // Delete chunks first (raw SQL because of vector column)
    await this.prisma.$executeRaw`DELETE FROM document_chunks WHERE document_id = ${id}`;

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
