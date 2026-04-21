import { IsIn, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryAdminUserDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['super_admin', 'editor'])
  role?: 'super_admin' | 'editor';

  @IsOptional()
  @IsString()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';
}
