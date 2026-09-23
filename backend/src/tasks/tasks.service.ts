import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    return this.prisma.task.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, workspaceId: string, userId: string) {
    await this.workspacesService.validateOwnership(workspaceId, userId);
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, workspaceId: string, userId: string, data: any) {
    await this.findOne(id, workspaceId, userId);
    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
      },
    });
  }
}
