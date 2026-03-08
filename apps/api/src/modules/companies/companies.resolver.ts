import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CompaniesService } from './companies.service';
import { CompanyType } from './dto/company.type';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Resolver(() => CompanyType)
export class CompaniesResolver {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Query(() => [CompanyType], { name: 'companies' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Public()
  @Query(() => CompanyType, { name: 'company' })
  findBySlug(@Args('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  /** query { myCompany { id name slug isVerified } } */
  @Roles('EMPLOYER')
  @Query(() => CompanyType, { name: 'myCompany' })
  getMyCompany(@CurrentUser() user: User) {
    return this.companiesService.findByOwner(user.id);
  }

  @Roles('EMPLOYER')
  @Mutation(() => CompanyType)
  createCompany(
    @Args('input') input: CreateCompanyDto,
    @CurrentUser() user: User,
  ) {
    return this.companiesService.create(input, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => CompanyType)
  updateCompany(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCompanyDto,
    @CurrentUser() user: User,
  ) {
    return this.companiesService.update(id, input, user);
  }

  @Roles('ADMIN')
  @Mutation(() => CompanyType)
  verifyCompany(@Args('id', { type: () => Int }) id: number) {
    return this.companiesService.verify(id);
  }
}
