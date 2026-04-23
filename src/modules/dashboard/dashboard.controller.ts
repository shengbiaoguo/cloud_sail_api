import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('bearer')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '后台首页概览数据' })
  getOverview(@Query() dto: DashboardOverviewQueryDto) {
    return this.dashboardService.getOverview(dto);
  }
}
