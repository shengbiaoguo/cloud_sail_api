import { Module } from '@nestjs/common';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminServiceController } from './controllers/admin-service.controller';
import { WebServiceController } from './controllers/web-service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [OperationLogModule],
  controllers: [AdminServiceController, WebServiceController],
  providers: [ServiceService],
  exports: [ServiceService]
})
export class ServiceModule {}
