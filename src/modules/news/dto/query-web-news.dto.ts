import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';
import { NEWS_CATEGORY_VALUES, type NewsCategoryValue } from './create-news.dto';

export class QueryWebNewsDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(NEWS_CATEGORY_VALUES)
  category?: NewsCategoryValue;
}
