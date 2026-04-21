import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';

@Injectable()
export class SiteConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService
  ) {}

  async getAdminConfigs() {
    const items = await this.prisma.siteConfig.findMany({
      orderBy: [
        {
          configKey: 'asc'
        }
      ],
      include: {
        updater: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      }
    });

    return {
      list: items.map((item) => ({
        id: item.id,
        configKey: item.configKey,
        configValue: this.parseConfigValue(item.configValue),
        description: item.description,
        updatedBy: item.updatedBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        updater: item.updater
      }))
    };
  }

  async getWebConfigs() {
    const items = await this.prisma.siteConfig.findMany({
      orderBy: [
        {
          configKey: 'asc'
        }
      ]
    });

    return items.reduce<Record<string, unknown>>((acc, item) => {
      acc[item.configKey] = this.parseConfigValue(item.configValue);
      return acc;
    }, {});
  }

  async updateConfigs(dto: UpdateSiteConfigDto, currentAdminId: string) {
    const normalizedItems = dto.items.map((item) => ({
      configKey: item.configKey.trim(),
      configValue: this.stringifyConfigValue(item.configValue),
      description: item.description?.trim() || null
    }));

    await this.prisma.$transaction(
      normalizedItems.map((item) =>
        this.prisma.siteConfig.upsert({
          where: {
            configKey: item.configKey
          },
          update: {
            configValue: item.configValue,
            description: item.description,
            updatedBy: BigInt(currentAdminId)
          },
          create: {
            configKey: item.configKey,
            configValue: item.configValue,
            description: item.description,
            updatedBy: BigInt(currentAdminId)
          }
        })
      )
    );

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'site_config',
      action: 'update',
      targetType: 'site_config',
      content: `更新站点配置 ${normalizedItems.map((item) => item.configKey).join(', ')}`
    });

    return this.getAdminConfigs();
  }

  private parseConfigValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private stringifyConfigValue(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
