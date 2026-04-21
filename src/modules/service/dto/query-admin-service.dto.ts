import { IsIn, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryAdminServiceDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'offline'])
  status?: 'draft' | 'published' | 'offline';
}
