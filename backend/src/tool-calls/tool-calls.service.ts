import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ToolCallsService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    return this.prisma.toolCall.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
