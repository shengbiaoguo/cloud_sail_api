import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { normalizeSlug } from '@/common/utils/slug.util';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateCaseStudyDto } from './dto/create-case-study.dto';
import { QueryAdminCaseStudyDto } from './dto/query-admin-case-study.dto';
import { QueryWebCaseStudyDto } from './dto/query-web-case-study.dto';
import { UpdateCaseStudyDto } from './dto/update-case-study.dto';

@Injectable()
export class CaseStudyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
  ) {}

  async findAdminList(dto: QueryAdminCaseStudyDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CaseStudyWhereInput = {
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
                clientName: {
                  contains: dto.keyword
                }
              },
              {
                industry: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.industry
        ? {
            industry: {
              contains: dto.industry
            }
          }
        : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.caseStudy.findMany({
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
      this.prisma.caseStudy.count({ where })
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
    const caseStudy = await this.prisma.caseStudy.findFirst({
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

    if (!caseStudy) {
      throw new NotFoundException('案例不存在');
    }

    return caseStudy;
  }

  async create(dto: CreateCaseStudyDto, currentAdminId: string) {
    const slug = this.resolveSlug(dto.slug, dto.title);
    await this.ensureSlugUnique(slug);

    const status = dto.status ?? 'draft';

    const caseStudy = await this.prisma.caseStudy.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        coverImage: dto.coverImage,
        content: dto.content,
        clientName: dto.clientName,
        industry: dto.industry,
        projectDate: dto.projectDate,
        seoTitle: dto.seoTitle,
        seoKeywords: dto.seoKeywords,
        seoDescription: dto.seoDescription,
        status,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: BigInt(currentAdminId),
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'case_study',
      action: 'create',
      targetId: caseStudy.id.toString(),
      targetType: 'case_study',
      content: `创建案例 ${caseStudy.title}`
    });

    return caseStudy;
  }

  async update(id: number, dto: UpdateCaseStudyDto, currentAdminId: string) {
    const existing = await this.requireCaseStudy(id);
    const nextSlug = dto.slug !== undefined || dto.title !== undefined
      ? this.resolveSlug(dto.slug ?? existing.slug, dto.title ?? existing.title)
      : existing.slug;

    if (nextSlug !== existing.slug) {
      await this.ensureSlugUnique(nextSlug, existing.id);
    }

    const caseStudy = await this.prisma.caseStudy.update({
      where: {
        id: existing.id
      },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        slug: nextSlug,
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
        ...(dto.projectDate !== undefined ? { projectDate: dto.projectDate } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoKeywords !== undefined ? { seoKeywords: dto.seoKeywords } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        updatedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'case_study',
      action: 'update',
      targetId: caseStudy.id.toString(),
      targetType: 'case_study',
      content: `更新案例 ${caseStudy.title}`
    });

    return caseStudy;
  }

  async remove(id: number, currentAdminId: string) {
    const existing = await this.requireCaseStudy(id);

    await this.prisma.caseStudy.update({
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
      module: 'case_study',
      action: 'delete',
      targetId: existing.id.toString(),
      targetType: 'case_study',
      content: `删除案例 ${existing.title}`
    });

    return {
      success: true
    };
  }

  async publish(id: number, currentAdminId: string) {
    const existing = await this.requireCaseStudy(id);

    const caseStudy = await this.prisma.caseStudy.update({
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
      module: 'case_study',
      action: 'publish',
      targetId: caseStudy.id.toString(),
      targetType: 'case_study',
      content: `发布案例 ${caseStudy.title}`
    });

    return caseStudy;
  }

  async offline(id: number, currentAdminId: string) {
    const existing = await this.requireCaseStudy(id);

    const caseStudy = await this.prisma.caseStudy.update({
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
      module: 'case_study',
      action: 'offline',
      targetId: caseStudy.id.toString(),
      targetType: 'case_study',
      content: `下线案例 ${caseStudy.title}`
    });

    return caseStudy;
  }

  async findWebList(dto: QueryWebCaseStudyDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CaseStudyWhereInput = {
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
              },
              {
                clientName: {
                  contains: dto.keyword
                }
              },
              {
                industry: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.industry
        ? {
            industry: {
              contains: dto.industry
            }
          }
        : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.caseStudy.findMany({
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
          clientName: true,
          industry: true,
          projectDate: true,
          seoTitle: true,
          seoKeywords: true,
          seoDescription: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.caseStudy.count({ where })
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
    const caseStudy = await this.prisma.caseStudy.findFirst({
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
        clientName: true,
        industry: true,
        projectDate: true,
        seoTitle: true,
        seoKeywords: true,
        seoDescription: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!caseStudy) {
      throw new NotFoundException('案例不存在');
    }

    return caseStudy;
  }

  private async requireCaseStudy(id: number) {
    const caseStudy = await this.prisma.caseStudy.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null
      }
    });

    if (!caseStudy) {
      throw new NotFoundException('案例不存在');
    }

    return caseStudy;
  }

  private async ensureSlugUnique(slug: string, excludeId?: bigint) {
    const existing = await this.prisma.caseStudy.findFirst({
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
}
