import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsIn(['super_admin', 'editor'])
  role?: 'super_admin' | 'editor';

  @IsOptional()
  @IsString()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';
}
