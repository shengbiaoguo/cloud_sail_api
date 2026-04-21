import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { normalizeSlug } from '@/common/utils/slug.util';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryAdminServiceDto } from './dto/query-admin-service.dto';
import { QueryWebServiceDto } from './dto/query-web-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
  ) {}

  async findAdminList(dto: QueryAdminServiceDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ServiceWhereInput = {
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
              },
              {
                summary: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.status ? { status: dto.status } : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
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
      this.prisma.service.count({ where })
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
    const service = await this.prisma.service.findFirst({
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

    if (!service) {
      throw new NotFoundException('服务不存在');
    }

    return service;
  }

  async create(dto: CreateServiceDto, currentAdminId: string) {
    const slug = this.resolveSlug(dto.slug, dto.title);
    await this.ensureSlugUnique(slug);

    const status = dto.status ?? 'draft';
    const publishedAt = this.resolvePublishedAt(status, dto.publishedAt);

    const service = await this.prisma.service.create({
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
        sortOrder: dto.sortOrder ?? 0,
        createdBy: BigInt(currentAdminId),
        updatedBy: BigInt(currentAdminId)
      }
    });

    if (publishedAt) {
      await this.prisma.service.update({
        where: {
          id: service.id
        },
        data: {
          updatedBy: BigInt(currentAdminId)
        }
      });
    }

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'service',
      action: 'create',
      targetId: service.id.toString(),
      targetType: 'service',
      content: `创建服务 ${service.title}`
    });

    return this.prisma.service.findUniqueOrThrow({
      where: {
        id: service.id
      }
    });
  }

  async update(id: number, dto: UpdateServiceDto, currentAdminId: string) {
    const existing = await this.requireService(id);
    const nextSlug = dto.slug !== undefined || dto.title !== undefined
      ? this.resolveSlug(dto.slug ?? existing.slug, dto.title ?? existing.title)
      : existing.slug;

    if (nextSlug !== existing.slug) {
      await this.ensureSlugUnique(nextSlug, existing.id);
    }

    const nextStatus = dto.status ?? existing.status;
    const publishedAt = this.resolvePublishedAt(
      nextStatus,
      dto.publishedAt !== undefined ? dto.publishedAt : null
    );

    const service = await this.prisma.service.update({
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
        updatedBy: BigInt(currentAdminId)
      }
    });

    if (publishedAt && nextStatus === 'published') {
      await this.prisma.service.update({
        where: {
          id: service.id
        },
        data: {
          updatedBy: BigInt(currentAdminId)
        }
      });
    }

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'service',
      action: 'update',
      targetId: service.id.toString(),
      targetType: 'service',
      content: `更新服务 ${service.title}`
    });

    return this.prisma.service.findUniqueOrThrow({
      where: {
        id: service.id
      }
    });
  }

  async remove(id: number, currentAdminId: string) {
    const existing = await this.requireService(id);

    await this.prisma.service.update({
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
      module: 'service',
      action: 'delete',
      targetId: existing.id.toString(),
      targetType: 'service',
      content: `删除服务 ${existing.title}`
    });

    return {
      success: true
    };
  }

  async publish(id: number, currentAdminId: string) {
    const existing = await this.requireService(id);

    const service = await this.prisma.service.update({
      where: {
        id: existing.id
      },
      data: {
        status: 'published',
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'service',
      action: 'publish',
      targetId: service.id.toString(),
      targetType: 'service',
      content: `发布服务 ${service.title}`
    });

    return service;
  }

  async offline(id: number, currentAdminId: string) {
    const existing = await this.requireService(id);

    const service = await this.prisma.service.update({
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
      module: 'service',
      action: 'offline',
      targetId: service.id.toString(),
      targetType: 'service',
      content: `下线服务 ${service.title}`
    });

    return service;
  }

  async findWebList(dto: QueryWebServiceDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ServiceWhereInput = {
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
      this.prisma.service.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          seoTitle: true,
          seoKeywords: true,
          seoDescription: true,
          createdAt: true,
          updatedAt: true,
          sortOrder: true
        }
      }),
      this.prisma.service.count({ where })
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
    const service = await this.prisma.service.findFirst({
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
        createdAt: true,
        updatedAt: true,
        sortOrder: true
      }
    });

    if (!service) {
      throw new NotFoundException('服务不存在');
    }

    return service;
  }

  private async requireService(id: number) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null
      }
    });

    if (!service) {
      throw new NotFoundException('服务不存在');
    }

    return service;
  }

  private async ensureSlugUnique(slug: string, excludeId?: bigint) {
    const existing = await this.prisma.service.findFirst({
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

    return null;
  }
}
