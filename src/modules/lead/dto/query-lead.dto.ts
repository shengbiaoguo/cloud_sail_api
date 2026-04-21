import { IsIn, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/common/dto/page-query.dto';

export class QueryLeadDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'contacted', 'converted', 'invalid'])
  status?: 'pending' | 'contacted' | 'converted' | 'invalid';

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
