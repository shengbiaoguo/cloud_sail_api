import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma, type NewsCategory } from '@prisma/client';
import { normalizeSlug } from '@/common/utils/slug.util';
import { PrismaService } from '@/database/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateNewsDto, NEWS_CATEGORY_VALUES, type NewsCategoryValue } from './dto/create-news.dto';
import { QueryAdminNewsDto } from './dto/query-admin-news.dto';
import { QueryWebNewsDto } from './dto/query-web-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

const WEB_NEWS_LIST_CACHE_PREFIX = 'news:web:list:';
const WEB_NEWS_DETAIL_CACHE_PREFIX = 'news:web:detail:';
const WEB_NEWS_VIEW_COUNT_KEY_PREFIX = 'news:web:view_count:';
const WEB_NEWS_LIST_CACHE_TTL_SECONDS = 300;
const WEB_NEWS_DETAIL_CACHE_TTL_SECONDS = 600;

const CATEGORY_LABEL_MAP: Record<NewsCategoryValue, string> = {
  industry_news: '行业资讯',
  writing_tips: '写作技巧',
  journal_submission: '期刊投稿',
  academic_service: '学术服务',
  research_integrity: '科研诚信'
};

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService,
    private readonly redisService: RedisService
  ) {}

  async findAdminList(dto: QueryAdminNewsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
      ...(dto.keyword
        ? {
            OR: [
              { title: { contains: dto.keyword } },
              { slug: { contains: dto.keyword } }
            ]
          }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.category ? { category: dto.category } : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'desc' }, { updatedAt: 'desc' }],
        include: {
          creator: { select: { id: true, username: true, nickname: true } },
          updater: { select: { id: true, username: true, nickname: true } }
        }
      }),
      this.prisma.news.count({ where })
    ]);

    return {
      list: list.map((item) => ({ ...item, tags: this.parseTags(item.tags) })),
      pagination: { page, pageSize, total }
    };
  }

  async findAdminDetail(id: number) {
    const news = await this.prisma.news.findFirst({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        creator: { select: { id: true, username: true, nickname: true } },
        updater: { select: { id: true, username: true, nickname: true } }
      }
    });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    return { ...news, tags: this.parseTags(news.tags) };
  }

  async create(dto: CreateNewsDto, currentAdminId: string) {
    const slug = this.resolveSlug(dto.slug, dto.title);
    await this.ensureSlugUnique(slug);

    const status = dto.status ?? 'draft';
    const publishedAt = this.resolvePublishedAt(status, dto.publishedAt);

    const news = await this.prisma.news.create({
      data: {
        title: dto.title,
        slug,
        category: (dto.category ?? 'industry_news') as NewsCategory,
        tags: this.stringifyTags(dto.tags),
        summary: dto.summary,
        coverImage: dto.coverImage,
        content: dto.content,
        seoTitle: dto.seoTitle,
        seoKeywords: dto.seoKeywords,
        seoDescription: dto.seoDescription,
        status,
        publishedAt,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: BigInt(currentAdminId),
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'create',
      targetId: news.id.toString(),
      targetType: 'news',
      content: `创建新闻 ${news.title}`
    });

    await this.invalidateWebNewsCache([news.slug]);

    return { ...news, tags: this.parseTags(news.tags) };
  }

  async update(id: number, dto: UpdateNewsDto, currentAdminId: string) {
    const existing = await this.requireNews(id);
    const nextSlug =
      dto.slug !== undefined || dto.title !== undefined
        ? this.resolveSlug(dto.slug ?? existing.slug, dto.title ?? existing.title)
        : existing.slug;

    if (nextSlug !== existing.slug) {
      await this.ensureSlugUnique(nextSlug, existing.id);
    }

    const nextStatus = dto.status ?? existing.status;
    const publishedAt = this.resolvePublishedAt(
      nextStatus,
      dto.publishedAt !== undefined ? dto.publishedAt : existing.publishedAt
    );

    const news = await this.prisma.news.update({
      where: { id: existing.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        slug: nextSlug,
        ...(dto.category !== undefined ? { category: dto.category as NewsCategory } : {}),
        ...(dto.tags !== undefined ? { tags: this.stringifyTags(dto.tags) } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoKeywords !== undefined ? { seoKeywords: dto.seoKeywords } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        publishedAt,
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'update',
      targetId: news.id.toString(),
      targetType: 'news',
      content: `更新新闻 ${news.title}`
    });

    await this.invalidateWebNewsCache([existing.slug, news.slug]);

    return { ...news, tags: this.parseTags(news.tags) };
  }

  async remove(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    await this.prisma.news.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), updatedBy: BigInt(currentAdminId) }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'delete',
      targetId: existing.id.toString(),
      targetType: 'news',
      content: `删除新闻 ${existing.title}`
    });

    await this.invalidateWebNewsCache([existing.slug]);

    return { success: true };
  }

  async publish(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    const news = await this.prisma.news.update({
      where: { id: existing.id },
      data: {
        status: 'published',
        publishedAt: existing.publishedAt ?? new Date(),
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'publish',
      targetId: news.id.toString(),
      targetType: 'news',
      content: `发布新闻 ${news.title}`
    });

    await this.invalidateWebNewsCache([news.slug]);

    return { ...news, tags: this.parseTags(news.tags) };
  }

  async offline(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    const news = await this.prisma.news.update({
      where: { id: existing.id },
      data: { status: 'offline', updatedBy: BigInt(currentAdminId) }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'offline',
      targetId: news.id.toString(),
      targetType: 'news',
      content: `下线新闻 ${news.title}`
    });

    await this.invalidateWebNewsCache([news.slug]);

    return { ...news, tags: this.parseTags(news.tags) };
  }

  async findWebList(dto: QueryWebNewsDto) {
    const cacheKey = this.buildWebNewsListCacheKey(dto);
    const cached = await this.redisService.getJson<{
      list: Array<Record<string, unknown>>;
      pagination: { page: number; pageSize: number; total: number };
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
      status: 'published',
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.keyword
        ? {
            OR: [
              { title: { contains: dto.keyword } },
              { summary: { contains: dto.keyword } },
              { tags: { contains: dto.keyword } }
            ]
          }
        : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          tags: true,
          summary: true,
          coverImage: true,
          seoTitle: true,
          seoKeywords: true,
          seoDescription: true,
          publishedAt: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.news.count({ where })
    ]);

    const formattedList = await Promise.all(
      list.map(async (item) => ({
        ...item,
        categoryLabel: CATEGORY_LABEL_MAP[item.category as NewsCategoryValue],
        tags: this.parseTags(item.tags),
        viewCount: await this.getViewCountBySlug(item.slug)
      }))
    );

    const result = {
      list: formattedList,
      pagination: { page, pageSize, total }
    };

    await this.redisService.setJson(cacheKey, result, WEB_NEWS_LIST_CACHE_TTL_SECONDS);

    return result;
  }

  async findWebPortal(dto: QueryWebNewsDto) {
    const listResult = await this.findWebList(dto);
    const [hotTopics, tagCloud] = await Promise.all([this.buildHotTopics(), this.buildTagCloud()]);

    return {
      tabs: [
        { key: 'all', label: '全部资讯' },
        ...NEWS_CATEGORY_VALUES.map((value) => ({ key: value, label: CATEGORY_LABEL_MAP[value] }))
      ],
      filters: {
        category: dto.category ?? 'all',
        keyword: dto.keyword ?? ''
      },
      ...listResult,
      hotTopics,
      tagCloud
    };
  }

  async findWebDetail(slug: string) {
    const cacheKey = this.buildWebNewsDetailCacheKey(slug);
    const cached = await this.redisService.getJson<Record<string, unknown>>(cacheKey);

    if (cached) {
      await this.redisService.increment(this.buildWebNewsViewCountKey(slug));
      const viewCount = await this.getViewCountBySlug(slug);
      return { ...cached, viewCount };
    }

    const news = await this.prisma.news.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        tags: true,
        summary: true,
        coverImage: true,
        content: true,
        seoTitle: true,
        seoKeywords: true,
        seoDescription: true,
        publishedAt: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    await this.redisService.increment(this.buildWebNewsViewCountKey(slug));
    const viewCount = await this.getViewCountBySlug(slug);

    const payload = {
      ...news,
      categoryLabel: CATEGORY_LABEL_MAP[news.category as NewsCategoryValue],
      tags: this.parseTags(news.tags),
      viewCount
    };

    await this.redisService.setJson(cacheKey, payload, WEB_NEWS_DETAIL_CACHE_TTL_SECONDS);

    return payload;
  }

  private async requireNews(id: number) {
    const news = await this.prisma.news.findFirst({
      where: { id: BigInt(id), deletedAt: null }
    });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    return news;
  }

  private async ensureSlugUnique(slug: string, excludeId?: bigint) {
    const existing = await this.prisma.news.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      }
    });

    if (existing) {
      throw new ConflictException('slug 已存在');
    }
  }

  private resolveSlug(rawSlug: string | undefined, title: string) {
    const slug = normalizeSlug(rawSlug || title);

    if (!slug) {
      throw new ConflictException('slug 不能为空');
    }

    return slug;
  }

  private resolvePublishedAt(status: ContentStatus, publishedAt?: Date | null) {
    if (status === 'published') {
      return publishedAt ?? new Date();
    }

    return publishedAt ?? null;
  }

  private buildWebNewsListCacheKey(dto: QueryWebNewsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const keyword = encodeURIComponent((dto.keyword ?? '').trim());
    const category = dto.category ?? 'all';

    return `${WEB_NEWS_LIST_CACHE_PREFIX}page=${page}&pageSize=${pageSize}&keyword=${keyword}&category=${category}`;
  }

  private buildWebNewsDetailCacheKey(slug: string) {
    return `${WEB_NEWS_DETAIL_CACHE_PREFIX}${slug}`;
  }

  private buildWebNewsViewCountKey(slug: string) {
    return `${WEB_NEWS_VIEW_COUNT_KEY_PREFIX}${slug}`;
  }

  private async getViewCountBySlug(slug: string) {
    return this.redisService.getNumber(this.buildWebNewsViewCountKey(slug));
  }

  private parseTags(rawTags: string | null | undefined): string[] {
    if (!rawTags) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawTags) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private stringifyTags(tags?: string[]) {
    if (!tags || tags.length === 0) {
      return null;
    }

    const normalized = Array.from(
      new Set(tags.map((item) => item.trim()).filter(Boolean))
    ).slice(0, 30);

    if (normalized.length === 0) {
      return null;
    }

    return JSON.stringify(normalized);
  }

  private async buildHotTopics() {
    const latestNews = await this.prisma.news.findMany({
      where: { deletedAt: null, status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'desc' }, { createdAt: 'desc' }],
      take: 30,
      select: {
        id: true,
        slug: true,
        title: true
      }
    });

    const withViews = await Promise.all(
      latestNews.map(async (item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        viewCount: await this.getViewCountBySlug(item.slug)
      }))
    );

    return withViews.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  }

  private async buildTagCloud() {
    const news = await this.prisma.news.findMany({
      where: { deletedAt: null, status: 'published' },
      select: { tags: true },
      take: 300
    });

    const counter = new Map<string, number>();

    for (const item of news) {
      for (const tag of this.parseTags(item.tags)) {
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([name, count]) => ({ name, count }));
  }

  private async invalidateWebNewsCache(slugs: string[] = []) {
    await this.redisService.deleteByPrefix(WEB_NEWS_LIST_CACHE_PREFIX);

    const detailKeys = Array.from(new Set(slugs.filter(Boolean))).map((slug) =>
      this.buildWebNewsDetailCacheKey(slug)
    );

    await this.redisService.deleteMany(detailKeys);
  }
}
