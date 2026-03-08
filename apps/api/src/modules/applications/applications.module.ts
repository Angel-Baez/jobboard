import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsResolver } from './applications.resolver';

@Module({
  providers: [ApplicationsService, ApplicationsResolver],
  controllers: [ApplicationsController],
  exports: [ApplicationsService], // Inngest route handler needs autoExpire()
})
export class ApplicationsModule {}
