import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryAdminCaseStudyDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'offline'])
  status?: 'draft' | 'published' | 'offline';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}
