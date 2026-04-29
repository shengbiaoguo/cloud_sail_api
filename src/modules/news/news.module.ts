import { Module } from '@nestjs/common';
import { RedisModule } from '@/redis/redis.module';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminNewsController } from './controllers/admin-news.controller';
import { WebNewsController } from './controllers/web-news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [OperationLogModule, RedisModule],
  controllers: [AdminNewsController, WebNewsController],
  providers: [NewsService],
  exports: [NewsService]
})
export class NewsModule {}
