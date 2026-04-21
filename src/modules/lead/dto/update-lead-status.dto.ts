import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateLeadStatusDto {
  @IsString()
  @IsIn(['pending', 'contacted', 'converted', 'invalid'])
  status!: 'pending' | 'contacted' | 'converted' | 'invalid';

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  contactedAt?: Date;
}
