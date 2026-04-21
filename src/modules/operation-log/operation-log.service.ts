import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';

interface CreateOperationLogInput {
  adminUserId?: string;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  content?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOperationLogInput) {
    return this.prisma.operationLog.create({
      data: {
        adminUserId: input.adminUserId ? BigInt(input.adminUserId) : null,
        module: input.module,
        action: input.action,
        targetId: input.targetId,
        targetType: input.targetType,
        content: input.content,
        ip: input.ip,
        userAgent: input.userAgent
      }
    });
  }

  async findAll(dto: QueryOperationLogDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OperationLogWhereInput = {
      ...(dto.module
        ? {
            module: dto.module
          }
        : {}),
      ...(dto.action
        ? {
            action: dto.action
          }
        : {}),
      ...(dto.adminUserId
        ? {
            adminUserId: BigInt(dto.adminUserId)
          }
        : {}),
      ...(dto.keyword
        ? {
            OR: [
              {
                content: {
                  contains: dto.keyword
                }
              },
              {
                targetId: {
                  contains: dto.keyword
                }
              },
              {
                targetType: {
                  contains: dto.keyword
                }
              },
              {
                module: {
                  contains: dto.keyword
                }
              },
              {
                action: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          adminUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
              role: true
            }
          }
        }
      }),
      this.prisma.operationLog.count({ where })
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

  async findOne(id: number) {
    const operationLog = await this.prisma.operationLog.findUnique({
      where: {
        id: BigInt(id)
      },
      include: {
        adminUser: {
          select: {
            id: true,
            username: true,
            nickname: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (!operationLog) {
      throw new NotFoundException('操作日志不存在');
    }

    return operationLog;
  }
}
