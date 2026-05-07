import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { NewsService } from '../news.service';
import { QueryWebNewsDto } from '../dto/query-web-news.dto';

@Public()
@ApiTags('Web News')
@Controller('web/news')
export class WebNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: '前台新闻列表' })
  findAll(@Query() dto: QueryWebNewsDto) {
    return this.newsService.findWebList(dto);
  }

  @Get('portal')
  @ApiOperation({ summary: '前台新闻门户聚合数据' })
  findPortal(@Query() dto: QueryWebNewsDto) {
    return this.newsService.findWebPortal(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: '前台新闻详情' })
  findOne(@Param('slug') slug: string) {
    return this.newsService.findWebDetail(slug);
  }
}
