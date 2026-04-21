import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { UpdateLeadRemarkDto } from './dto/update-lead-remark.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
  ) {}

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        company: dto.company,
        sourcePage: dto.sourcePage,
        message: dto.message,
        status: 'pending'
      }
    });
  }

  async findAdminList(dto: QueryLeadDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.LeadWhereInput = {
      ...(dto.keyword
        ? {
            OR: [
              {
                name: {
                  contains: dto.keyword
                }
              },
              {
                phone: {
                  contains: dto.keyword
                }
              },
              {
                email: {
                  contains: dto.keyword
                }
              },
              {
                company: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.assignedTo ? { assignedTo: BigInt(dto.assignedTo) } : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              nickname: true,
              role: true
            }
          }
        }
      }),
      this.prisma.lead.count({ where })
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
    const lead = await this.prisma.lead.findUnique({
      where: {
        id: BigInt(id)
      },
      include: {
        assignee: {
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

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    return lead;
  }

  async updateStatus(id: number, dto: UpdateLeadStatusDto, currentAdminId: string) {
    const lead = await this.requireLead(id);
    const nextStatus = dto.status;

    const updated = await this.prisma.lead.update({
      where: {
        id: lead.id
      },
      data: {
        status: nextStatus,
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo ? BigInt(dto.assignedTo) : null } : {}),
        contactedAt: this.resolveContactedAt(nextStatus, dto.contactedAt, lead.contactedAt)
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            nickname: true,
            role: true
          }
        }
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'lead',
      action: 'update_status',
      targetId: updated.id.toString(),
      targetType: 'lead',
      content: `更新线索 ${updated.name} 状态为 ${updated.status}`
    });

    return updated;
  }

  async updateRemark(id: number, dto: UpdateLeadRemarkDto, currentAdminId: string) {
    const lead = await this.requireLead(id);

    const updated = await this.prisma.lead.update({
      where: {
        id: lead.id
      },
      data: {
        remark: dto.remark
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            nickname: true,
            role: true
          }
        }
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'lead',
      action: 'update_remark',
      targetId: updated.id.toString(),
      targetType: 'lead',
      content: `更新线索 ${updated.name} 备注`
    });

    return updated;
  }

  private async requireLead(id: number) {
    const lead = await this.prisma.lead.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    return lead;
  }

  private resolveContactedAt(
    status: LeadStatus,
    dtoContactedAt?: Date,
    existingContactedAt?: Date | null
  ) {
    if (dtoContactedAt !== undefined) {
      return dtoContactedAt;
    }

    if (status === 'contacted' || status === 'converted') {
      return existingContactedAt ?? new Date();
    }

    return existingContactedAt ?? null;
  }
}
