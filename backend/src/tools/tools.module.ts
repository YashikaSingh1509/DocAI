import { Module } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';
import { ToolExecutorService } from './tool-executor.service';

@Module({
  providers: [ToolRegistryService, ToolExecutorService],
  exports: [ToolRegistryService, ToolExecutorService],
})
export class ToolsModule {}
