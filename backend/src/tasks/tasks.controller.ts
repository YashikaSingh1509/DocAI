import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/workspaces/:workspaceId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.tasksService.findAllByWorkspace(workspaceId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findOne(id, workspaceId, user.id);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.tasksService.update(id, workspaceId, user.id, data);
  }
}
