import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { QueryWebServiceDto } from '../dto/query-web-service.dto';
import { ServiceService } from '../service.service';

@Public()
@ApiTags('Web Services')
@Controller('web/services')
export class WebServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: '前台服务列表' })
  findAll(@Query() dto: QueryWebServiceDto) {
    return this.serviceService.findWebList(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: '前台服务详情' })
  findOne(@Param('slug') slug: string) {
    return this.serviceService.findWebDetail(slug);
  }
}
