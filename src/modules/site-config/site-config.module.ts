import { Module } from '@nestjs/common';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminSiteConfigController } from './admin-site-config.controller';
import { WebSiteConfigController } from './web-site-config.controller';
import { SiteConfigService } from './site-config.service';

@Module({
  imports: [OperationLogModule],
  controllers: [AdminSiteConfigController, WebSiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService]
})
export class SiteConfigModule {}
