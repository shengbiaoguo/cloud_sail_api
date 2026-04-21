import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, AdminUser } from '@prisma/client';
import { hashPassword } from '@/common/utils/password.util';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { QueryAdminUserDto } from './dto/query-admin-user.dto';
import { UpdateAdminPasswordDto } from './dto/update-admin-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
  ) {}

  findById(id: string | number | bigint) {
    return this.prisma.adminUser.findUnique({
      where: {
        id: this.toBigInt(id)
      }
    });
  }

  findByUsername(username: string) {
    return this.prisma.adminUser.findUnique({
      where: {
        username
      }
    });
  }

  async findAll(dto: QueryAdminUserDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AdminUserWhereInput = {
      ...(dto.keyword
        ? {
            OR: [
              {
                username: {
                  contains: dto.keyword
                }
              },
              {
                nickname: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {}),
      ...(dto.role ? { role: dto.role } : {}),
      ...(dto.status ? { status: dto.status } : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.adminUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.adminUser.count({ where })
    ]);

    return {
      list: list.map((item) => this.toSafeProfile(item)),
      pagination: {
        page,
        pageSize,
        total
      }
    };
  }

  async findOne(id: number) {
    const adminUser = await this.findById(id);

    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }

    return this.toSafeProfile(adminUser);
  }

  async create(dto: CreateAdminUserDto, currentAdminId: string) {
    const existing = await this.findByUsername(dto.username);

    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const adminUser = await this.prisma.adminUser.create({
      data: {
        username: dto.username,
        passwordHash: await hashPassword(dto.password),
        nickname: dto.nickname,
        role: dto.role,
        status: 'enabled'
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'admin_user',
      action: 'create',
      targetId: adminUser.id.toString(),
      targetType: 'admin_user',
      content: `创建管理员 ${adminUser.username}`
    });

    return this.toSafeProfile(adminUser);
  }

  async update(id: number, dto: UpdateAdminUserDto, currentAdminId: string) {
    const adminUser = await this.findById(id);

    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }

    if (adminUser.username === 'admin' && dto.status === 'disabled') {
      throw new BadRequestException('默认管理员不能被禁用');
    }

    const updated = await this.prisma.adminUser.update({
      where: {
        id: this.toBigInt(id)
      },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {})
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'admin_user',
      action: 'update',
      targetId: updated.id.toString(),
      targetType: 'admin_user',
      content: `更新管理员 ${updated.username}`
    });

    return this.toSafeProfile(updated);
  }

  async updatePassword(id: number, dto: UpdateAdminPasswordDto, currentAdminId: string) {
    const adminUser = await this.findById(id);

    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }

    await this.prisma.adminUser.update({
      where: {
        id: this.toBigInt(id)
      },
      data: {
        passwordHash: await hashPassword(dto.password)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'admin_user',
      action: 'update_password',
      targetId: adminUser.id.toString(),
      targetType: 'admin_user',
      content: `修改管理员 ${adminUser.username} 密码`
    });

    return {
      success: true
    };
  }

  updateLastLoginAt(id: bigint) {
    return this.prisma.adminUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date()
      }
    });
  }

  toSafeProfile(adminUser: AdminUser) {
    return {
      id: adminUser.id,
      username: adminUser.username,
      nickname: adminUser.nickname,
      role: adminUser.role,
      status: adminUser.status,
      lastLoginAt: adminUser.lastLoginAt,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt
    };
  }

  private toBigInt(id: string | number | bigint) {
    return typeof id === 'bigint' ? id : BigInt(id);
  }
}
