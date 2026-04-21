import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { CreateServiceDto } from '../dto/create-service.dto';
import { QueryAdminServiceDto } from '../dto/query-admin-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceService } from '../service.service';

@ApiTags('Admin Services')
@ApiBearerAuth('bearer')
@Controller('admin/services')
export class AdminServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: '后台服务列表' })
  findAll(@Query() dto: QueryAdminServiceDto) {
    return this.serviceService.findAdminList(dto);
  }

  @Post()
  @ApiOperation({ summary: '新建服务' })
  create(@Body() dto: CreateServiceDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.serviceService.create(dto, currentAdminId);
  }

  @Get(':id')
  @ApiOperation({ summary: '后台服务详情' })
  findOne(@Param() params: IdParamDto) {
    return this.serviceService.findAdminDetail(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑服务' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateServiceDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.serviceService.update(params.id, dto, currentAdminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除服务' })
  remove(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.serviceService.remove(params.id, currentAdminId);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: '发布服务' })
  publish(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.serviceService.publish(params.id, currentAdminId);
  }

  @Patch(':id/offline')
  @ApiOperation({ summary: '下线服务' })
  offline(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.serviceService.offline(params.id, currentAdminId);
  }
}
