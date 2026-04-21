import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { CaseStudyService } from '../case-study.service';
import { CreateCaseStudyDto } from '../dto/create-case-study.dto';
import { QueryAdminCaseStudyDto } from '../dto/query-admin-case-study.dto';
import { UpdateCaseStudyDto } from '../dto/update-case-study.dto';

@ApiTags('Admin Case Studies')
@ApiBearerAuth('bearer')
@Controller('admin/case-studies')
export class AdminCaseStudyController {
  constructor(private readonly caseStudyService: CaseStudyService) {}

  @Get()
  @ApiOperation({ summary: '后台案例列表' })
  findAll(@Query() dto: QueryAdminCaseStudyDto) {
    return this.caseStudyService.findAdminList(dto);
  }

  @Post()
  @ApiOperation({ summary: '新建案例' })
  create(@Body() dto: CreateCaseStudyDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.caseStudyService.create(dto, currentAdminId);
  }

  @Get(':id')
  @ApiOperation({ summary: '后台案例详情' })
  findOne(@Param() params: IdParamDto) {
    return this.caseStudyService.findAdminDetail(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑案例' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateCaseStudyDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.caseStudyService.update(params.id, dto, currentAdminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除案例' })
  remove(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.caseStudyService.remove(params.id, currentAdminId);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: '发布案例' })
  publish(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.caseStudyService.publish(params.id, currentAdminId);
  }

  @Patch(':id/offline')
  @ApiOperation({ summary: '下线案例' })
  offline(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.caseStudyService.offline(params.id, currentAdminId);
  }
}
