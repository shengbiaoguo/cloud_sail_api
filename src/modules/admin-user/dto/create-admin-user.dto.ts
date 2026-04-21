import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nickname!: string;

  @IsString()
  @IsIn(['super_admin', 'editor'])
  role!: 'super_admin' | 'editor';
}
