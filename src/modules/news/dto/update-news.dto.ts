import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NEWS_CATEGORY_VALUES, type NewsCategoryValue } from './create-news.dto';

export class UpdateNewsDto {
  @ApiPropertyOptional({ example: 'SCI投稿全流程详解：从投稿到接收的完整指南（更新）' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'sci-submission-complete-guide-v2' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ enum: NEWS_CATEGORY_VALUES, example: 'journal_submission' })
  @IsOptional()
  @IsString()
  @IsIn(NEWS_CATEGORY_VALUES)
  category?: NewsCategoryValue;

  @ApiPropertyOptional({ type: [String], example: ['SCI投稿', '投稿经验', '返修技巧'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30);
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: '更新后的摘要内容。' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/news/sci-cover-v2.jpg' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ example: '<p>更新后的正文内容...</p>' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: '更新后的SEO标题' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'SCI投稿,返修,审稿' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  seoKeywords?: string;

  @ApiPropertyOptional({ example: '更新后的SEO描述。' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'offline'], example: 'published' })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'offline'])
  status?: 'draft' | 'published' | 'offline';

  @ApiPropertyOptional({ example: '2026-05-08T10:30:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
