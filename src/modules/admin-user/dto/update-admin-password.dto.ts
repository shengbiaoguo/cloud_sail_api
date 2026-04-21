import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAdminPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  password!: string;
}
