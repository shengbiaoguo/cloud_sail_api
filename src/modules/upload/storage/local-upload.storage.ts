import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join, posix } from 'path';
import {
  UploadStorage,
  UploadStorageSaveInput,
  UploadStorageSaveResult
} from './upload-storage.interface';

@Injectable()
export class LocalUploadStorage implements UploadStorage {
  constructor(private readonly configService: ConfigService) {}

  async save(input: UploadStorageSaveInput): Promise<UploadStorageSaveResult> {
    const rootDir = this.configService.get<string>('upload.dir', 'uploads');
    const baseUrl = this.configService.get<string>('upload.baseUrl', '/uploads');
    const datePath = this.getDatePath();
    const extension = extname(input.file.originalname || '').toLowerCase();
    const safeExtension = extension || this.guessExtension(input.file.mimetype);
    const generatedFileName = `${randomUUID().replace(/-/g, '')}${safeExtension}`;
    const relativePath = input.folder
      ? join(input.folder, datePath, generatedFileName)
      : join(datePath, generatedFileName);
    const absolutePath = join(rootDir, relativePath);
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');

    await mkdir(join(rootDir, input.folder || '', datePath), {
      recursive: true
    });
    await writeFile(absolutePath, input.file.buffer);

    return {
      fileName: input.file.originalname,
      filePath: absolutePath,
      fileUrl: posix.join(baseUrl, normalizedRelativePath)
    };
  }

  private getDatePath() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  private guessExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'image/svg+xml':
        return '.svg';
      default:
        return '';
    }
  }
}
