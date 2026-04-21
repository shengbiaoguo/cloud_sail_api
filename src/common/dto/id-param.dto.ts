import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdParamDto {
  @ApiProperty({ example: 1, description: '主键 ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
