import { Module } from '@nestjs/common';
import { ToolCallsService } from './tool-calls.service';
import { ToolCallsController } from './tool-calls.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [ToolCallsController],
  providers: [ToolCallsService],
})
export class ToolCallsModule {}
