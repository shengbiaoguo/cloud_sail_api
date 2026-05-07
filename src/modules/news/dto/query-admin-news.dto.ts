import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from '@/common/dto/page-query.dto';
import { NEWS_CATEGORY_VALUES, type NewsCategoryValue } from './create-news.dto';

export class QueryAdminNewsDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'published', 'offline'], example: 'published' })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'offline'])
  status?: 'draft' | 'published' | 'offline';

  @ApiPropertyOptional({ enum: NEWS_CATEGORY_VALUES, example: 'journal_submission' })
  @IsOptional()
  @IsString()
  @IsIn(NEWS_CATEGORY_VALUES)
  category?: NewsCategoryValue;
}
