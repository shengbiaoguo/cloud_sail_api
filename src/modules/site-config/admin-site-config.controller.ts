import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { SiteConfigService } from './site-config.service';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';

@ApiTags('Admin Site Config')
@ApiBearerAuth('bearer')
@Roles('super_admin')
@Controller('admin/site-config')
export class AdminSiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取后台站点配置' })
  findAll() {
    return this.siteConfigService.getAdminConfigs();
  }

  @Put()
  @ApiOperation({ summary: '批量更新站点配置' })
  update(@Body() dto: UpdateSiteConfigDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.siteConfigService.updateConfigs(dto, currentAdminId);
  }
}
