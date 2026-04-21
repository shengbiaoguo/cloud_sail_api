import { Module } from '@nestjs/common';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminLeadController } from './admin-lead.controller';
import { WebLeadController } from './web-lead.controller';
import { LeadService } from './lead.service';

@Module({
  imports: [OperationLogModule],
  controllers: [AdminLeadController, WebLeadController],
  providers: [LeadService],
  exports: [LeadService]
})
export class LeadModule {}
