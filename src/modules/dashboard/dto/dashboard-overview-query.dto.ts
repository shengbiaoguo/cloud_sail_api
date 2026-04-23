import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardOverviewQueryDto {
  @ApiPropertyOptional({
    example: 3,
    description: '最近线索条数，默认 3，最大 10'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  leadLimit?: number = 3;

  @ApiPropertyOptional({
    example: 3,
    description: '最近内容条数，默认 3，最大 10'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  contentLimit?: number = 3;
}
