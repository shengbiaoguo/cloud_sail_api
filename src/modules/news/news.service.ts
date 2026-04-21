import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { normalizeSlug } from '@/common/utils/slug.util';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryAdminNewsDto } from './dto/query-admin-news.dto';
import { QueryWebNewsDto } from './dto/query-web-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
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
              {
                title: {
                  contains: dto.keyword
                }
              },
              {
                slug: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.status ? { status: dto.status } : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'desc' }, { updatedAt: 'desc' }],
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              nickname: true
            }
          },
          updater: {
            select: {
              id: true,
              username: true,
              nickname: true
            }
          }
        }
      }),
      this.prisma.news.count({ where })
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total
      }
    };
  }

  async findAdminDetail(id: number) {
    const news = await this.prisma.news.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        },
        updater: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      }
    });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    return news;
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

    return news;
  }

  async update(id: number, dto: UpdateNewsDto, currentAdminId: string) {
    const existing = await this.requireNews(id);
    const nextSlug = dto.slug !== undefined || dto.title !== undefined
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
      where: {
        id: existing.id
      },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        slug: nextSlug,
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

    return news;
  }

  async remove(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    await this.prisma.news.update({
      where: {
        id: existing.id
      },
      data: {
        deletedAt: new Date(),
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'delete',
      targetId: existing.id.toString(),
      targetType: 'news',
      content: `删除新闻 ${existing.title}`
    });

    return {
      success: true
    };
  }

  async publish(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    const news = await this.prisma.news.update({
      where: {
        id: existing.id
      },
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

    return news;
  }

  async offline(id: number, currentAdminId: string) {
    const existing = await this.requireNews(id);

    const news = await this.prisma.news.update({
      where: {
        id: existing.id
      },
      data: {
        status: 'offline',
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'news',
      action: 'offline',
      targetId: news.id.toString(),
      targetType: 'news',
      content: `下线新闻 ${news.title}`
    });

    return news;
  }

  async findWebList(dto: QueryWebNewsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
      status: 'published',
      ...(dto.keyword
        ? {
            OR: [
              {
                title: {
                  contains: dto.keyword
                }
              },
              {
                summary: {
                  contains: dto.keyword
                }
              }
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

    return {
      list,
      pagination: {
        page,
        pageSize,
        total
      }
    };
  }

  async findWebDetail(slug: string) {
    const news = await this.prisma.news.findFirst({
      where: {
        slug,
        status: 'published',
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        slug: true,
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

    return news;
  }

  private async requireNews(id: number) {
    const news = await this.prisma.news.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null
      }
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
}
