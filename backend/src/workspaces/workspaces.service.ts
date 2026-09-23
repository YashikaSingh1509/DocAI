import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.workspace.create({
      data: {
        name,
        ownerId: userId,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { ownerId: userId },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return workspace;
  }

  async update(id: string, userId: string, name?: string) {
    await this.validateOwnership(id, userId);

    return this.prisma.workspace.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: string, userId: string) {
    await this.validateOwnership(id, userId);

    return this.prisma.workspace.delete({
      where: { id },
    });
  }

  async validateOwnership(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
