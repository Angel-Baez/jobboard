import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsResolver } from './jobs.resolver';

@Module({
  providers: [JobsService, JobsResolver],
  controllers: [JobsController],
  exports: [JobsService], // ApplicationsModule will need this
})
export class JobsModule {}
