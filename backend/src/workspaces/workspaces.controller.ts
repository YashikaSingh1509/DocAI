import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, createWorkspaceDto.name);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspacesService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.findOne(id, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, user.id, updateWorkspaceDto.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.remove(id, user.id);
  }
}
