import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompaniesResolver } from './companies.resolver';

@Module({
  providers: [CompaniesService, CompaniesResolver],
  controllers: [CompaniesController],
  exports: [CompaniesService], // JobsModule necesita findByOwner()
})
export class CompaniesModule {}
