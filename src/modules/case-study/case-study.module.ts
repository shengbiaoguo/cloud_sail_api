import { Module } from '@nestjs/common';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminCaseStudyController } from './controllers/admin-case-study.controller';
import { WebCaseStudyController } from './controllers/web-case-study.controller';
import { CaseStudyService } from './case-study.service';

@Module({
  imports: [OperationLogModule],
  controllers: [AdminCaseStudyController, WebCaseStudyController],
  providers: [CaseStudyService],
  exports: [CaseStudyService]
})
export class CaseStudyModule {}
