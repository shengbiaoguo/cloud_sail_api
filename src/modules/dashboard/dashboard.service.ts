import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';

type LatestContentItem = {
  id: bigint;
  title: string;
  type: 'news' | 'case_study' | 'service';
  status: string;
  updatedAt: Date;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(dto: DashboardOverviewQueryDto) {
    const leadLimit = dto.leadLimit ?? 3;
    const contentLimit = dto.contentLimit ?? 3;

    const [
      newsCount,
      caseStudyCount,
      serviceCount,
      leadCount,
      latestLeads,
      latestNews,
      latestCaseStudies,
      latestServices
    ] = await this.prisma.$transaction([
      this.prisma.news.count({
        where: {
          deletedAt: null
        }
      }),
      this.prisma.caseStudy.count({
        where: {
          deletedAt: null
        }
      }),
      this.prisma.service.count({
        where: {
          deletedAt: null
        }
      }),
      this.prisma.lead.count(),
      this.prisma.lead.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: leadLimit,
        select: {
          id: true,
          name: true,
          company: true,
          status: true,
          createdAt: true
        }
      }),
      this.prisma.news.findMany({
        where: {
          deletedAt: null
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: contentLimit,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true
        }
      }),
      this.prisma.caseStudy.findMany({
        where: {
          deletedAt: null
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: contentLimit,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true
        }
      }),
      this.prisma.service.findMany({
        where: {
          deletedAt: null
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: contentLimit,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true
        }
      })
    ]);

    const latestContents = this.mergeLatestContents(
      latestNews.map((item) => ({ ...item, type: 'news' as const })),
      latestCaseStudies.map((item) => ({ ...item, type: 'case_study' as const })),
      latestServices.map((item) => ({ ...item, type: 'service' as const })),
      contentLimit
    );

    return {
      stats: {
        newsCount,
        caseStudyCount,
        serviceCount,
        leadCount
      },
      latestLeads,
      latestContents
    };
  }

  private mergeLatestContents(
    news: LatestContentItem[],
    caseStudies: LatestContentItem[],
    services: LatestContentItem[],
    limit: number
  ) {
    return [...news, ...caseStudies, ...services]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
}
