import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Public()
@ApiTags('Web Leads')
@Controller('web/leads')
export class WebLeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: '前台提交线索' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadService.create(dto);
  }
}
