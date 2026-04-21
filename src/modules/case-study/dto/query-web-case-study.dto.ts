import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryWebCaseStudyDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}
