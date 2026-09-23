import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ToolCallsService } from './tool-calls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/workspaces/:workspaceId/tool-calls')
export class ToolCallsController {
  constructor(private readonly toolCallsService: ToolCallsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.toolCallsService.findAllByWorkspace(workspaceId, user.id);
  }
}
