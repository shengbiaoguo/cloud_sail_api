import {
  BadRequestException,
  Inject,
  Injectable
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { QueryUploadDto } from './dto/query-upload.dto';
import {
  UploadStorage,
  UPLOAD_STORAGE_TOKEN
} from './storage/upload-storage.interface';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogService: OperationLogService,
    @Inject(UPLOAD_STORAGE_TOKEN)
    private readonly uploadStorage: UploadStorage
  ) {}

  async uploadImage(file: Express.Multer.File | undefined, currentAdminId: string) {
    if (!file) {
      throw new BadRequestException('请选择图片文件');
    }

    const storedFile = await this.uploadStorage.save({
      file,
      folder: 'images'
    });

    const uploadRecord = await this.prisma.uploadFile.create({
      data: {
        fileName: storedFile.fileName,
        filePath: storedFile.filePath,
        fileUrl: storedFile.fileUrl,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        uploadedBy: BigInt(currentAdminId)
      }
    });

    await this.operationLogService.create({
      adminUserId: currentAdminId,
      module: 'upload',
      action: 'upload_image',
      targetId: uploadRecord.id.toString(),
      targetType: 'upload_file',
      content: `上传图片 ${uploadRecord.fileName}`
    });

    return uploadRecord;
  }

  async findAll(dto: QueryUploadDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UploadFileWhereInput = {
      ...(dto.keyword
        ? {
            OR: [
              {
                fileName: {
                  contains: dto.keyword
                }
              },
              {
                mimeType: {
                  contains: dto.keyword
                }
              }
            ]
          }
        : {})
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.uploadFile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              nickname: true
            }
          }
        }
      }),
      this.prisma.uploadFile.count({ where })
    ]);

    return {
      list: list.map((item) => this.withUploadedByName(item)),
      pagination: {
        page,
        pageSize,
        total
      }
    };
  }

  private withUploadedByName<T extends { uploader?: { nickname?: string | null; username?: string | null } | null }>(
    item: T
  ) {
    return {
      ...item,
      uploadedByName: item.uploader?.nickname || item.uploader?.username || ''
    };
  }
}
