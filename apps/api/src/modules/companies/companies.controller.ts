import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ── Public endpoints ──────────────────────────────────────

  @Public()
  @Get()
  findAll(@Query('search') search?: string) {
    if (search) return this.companiesService.search(search);
    return this.companiesService.findAll();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  // ── Employer endpoints ────────────────────────────────────

  /** GET /companies/me — employer's own company */
  @Roles('EMPLOYER')
  @Get('me')
  getMyCompany(@CurrentUser() user: User) {
    return this.companiesService.findByOwner(user.id);
  }

  @Roles('EMPLOYER')
  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: User) {
    return this.companiesService.create(dto, user);
  }

  @Roles('EMPLOYER')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: User,
  ) {
    return this.companiesService.update(id, dto, user);
  }

  // ── Admin endpoints ───────────────────────────────────────

  @Roles('ADMIN')
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.verify(id);
  }
}
