import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { SiteConfigService } from './site-config.service';

@Public()
@ApiTags('Web Site Config')
@Controller('web/site-config')
export class WebSiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取前台站点配置' })
  findAll() {
    return this.siteConfigService.getWebConfigs();
  }
}
