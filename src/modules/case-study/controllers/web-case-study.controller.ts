import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CaseStudyService } from '../case-study.service';
import { QueryWebCaseStudyDto } from '../dto/query-web-case-study.dto';

@Public()
@ApiTags('Web Case Studies')
@Controller('web/case-studies')
export class WebCaseStudyController {
  constructor(private readonly caseStudyService: CaseStudyService) {}

  @Get()
  @ApiOperation({ summary: '前台案例列表' })
  findAll(@Query() dto: QueryWebCaseStudyDto) {
    return this.caseStudyService.findWebList(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: '前台案例详情' })
  findOne(@Param('slug') slug: string) {
    return this.caseStudyService.findWebDetail(slug);
  }
}
