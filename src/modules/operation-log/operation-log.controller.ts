import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { OperationLogService } from './operation-log.service';

@ApiTags('Admin Operation Logs')
@ApiBearerAuth('bearer')
@Roles('super_admin')
@Controller('admin/operation-logs')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get()
  @ApiOperation({ summary: '操作日志列表' })
  findAll(@Query() dto: QueryOperationLogDto) {
    return this.operationLogService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '操作日志详情' })
  findOne(@Param() params: IdParamDto) {
    return this.operationLogService.findOne(params.id);
  }
}
