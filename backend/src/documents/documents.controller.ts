import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('api/workspaces/:workspaceId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.documentsService.upload(workspaceId, user.id, file);
  }

  @Get()
  findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.documentsService.findAllByWorkspace(workspaceId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.findOne(id, workspaceId, user.id);
  }

  @Delete(':id')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.remove(id, workspaceId, user.id);
  }
}
