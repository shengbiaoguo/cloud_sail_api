import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { NewsService } from '../news.service';
import { CreateNewsDto } from '../dto/create-news.dto';
import { QueryAdminNewsDto } from '../dto/query-admin-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';

@ApiTags('Admin News')
@ApiBearerAuth('bearer')
@Controller('admin/news')
export class AdminNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: '后台新闻列表' })
  findAll(@Query() dto: QueryAdminNewsDto) {
    return this.newsService.findAdminList(dto);
  }

  @Post()
  @ApiOperation({ summary: '新建新闻' })
  create(@Body() dto: CreateNewsDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.newsService.create(dto, currentAdminId);
  }

  @Get(':id')
  @ApiOperation({ summary: '后台新闻详情' })
  findOne(@Param() params: IdParamDto) {
    return this.newsService.findAdminDetail(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑新闻' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateNewsDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.newsService.update(params.id, dto, currentAdminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除新闻' })
  remove(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.newsService.remove(params.id, currentAdminId);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: '发布新闻' })
  publish(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.newsService.publish(params.id, currentAdminId);
  }

  @Patch(':id/offline')
  @ApiOperation({ summary: '下线新闻' })
  offline(@Param() params: IdParamDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.newsService.offline(params.id, currentAdminId);
  }
}
