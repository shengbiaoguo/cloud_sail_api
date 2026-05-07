import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const NEWS_CATEGORY_VALUES = [
  'industry_news',
  'writing_tips',
  'journal_submission',
  'academic_service',
  'research_integrity'
] as const;

export type NewsCategoryValue = (typeof NEWS_CATEGORY_VALUES)[number];

export class CreateNewsDto {
  @ApiProperty({ example: 'SCI投稿全流程详解：从投稿到接收的完整指南' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'sci-submission-complete-guide' })
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

  @ApiPropertyOptional({
    type: [String],
    example: ['SCI投稿', '期刊选择', '投稿经验']
  })
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

  @ApiPropertyOptional({ example: '详解投稿准备、投稿步骤、审稿流程与常见问题。' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/news/sci-cover.jpg' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiProperty({ example: '<p>这里是新闻正文 HTML 内容...</p>' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'SCI投稿全流程指南 - Cloud Sail' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'SCI投稿,期刊投稿,学术写作' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  seoKeywords?: string;

  @ApiPropertyOptional({ example: 'SCI投稿流程详解与实操建议，帮助你提升投稿成功率。' })
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

  @ApiPropertyOptional({ example: '2026-05-07T10:30:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
