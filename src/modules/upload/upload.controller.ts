import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import { QueryUploadDto } from './dto/query-upload.dto';
import { UploadService } from './upload.service';

@ApiTags('Admin Uploads')
@ApiBearerAuth('bearer')
@Controller('admin')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload/image')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      },
      required: ['file']
    }
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024
      },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new Error('只允许上传图片文件'), false);
          return;
        }

        callback(null, true);
      }
    })
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.uploadService.uploadImage(file, currentAdminId);
  }

  @Get('uploads')
  @ApiOperation({ summary: '上传文件列表' })
  findAll(@Query() dto: QueryUploadDto) {
    return this.uploadService.findAll(dto);
  }
}
