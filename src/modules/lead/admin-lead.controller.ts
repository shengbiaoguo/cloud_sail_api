import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { LeadService } from './lead.service';
import { QueryLeadDto } from './dto/query-lead.dto';
import { UpdateLeadRemarkDto } from './dto/update-lead-remark.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@ApiTags('Admin Leads')
@ApiBearerAuth('bearer')
@Controller('admin/leads')
export class AdminLeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  @ApiOperation({ summary: '后台线索列表' })
  findAll(@Query() dto: QueryLeadDto) {
    return this.leadService.findAdminList(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '后台线索详情' })
  findOne(@Param() params: IdParamDto) {
    return this.leadService.findAdminDetail(params.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新线索状态' })
  updateStatus(
    @Param() params: IdParamDto,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.leadService.updateStatus(params.id, dto, currentAdminId);
  }

  @Patch(':id/remark')
  @ApiOperation({ summary: '更新线索备注' })
  updateRemark(
    @Param() params: IdParamDto,
    @Body() dto: UpdateLeadRemarkDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.leadService.updateRemark(params.id, dto, currentAdminId);
  }
}
