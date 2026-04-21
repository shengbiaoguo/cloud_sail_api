import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryOperationLogDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  adminUserId?: string;
}
