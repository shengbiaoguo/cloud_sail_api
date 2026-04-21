import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { LocalUploadStorage } from './storage/local-upload.storage';
import { UPLOAD_STORAGE_TOKEN } from './storage/upload-storage.interface';

@Module({
  imports: [ConfigModule, OperationLogModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    LocalUploadStorage,
    {
      provide: UPLOAD_STORAGE_TOKEN,
      inject: [ConfigService, LocalUploadStorage],
      useFactory: (configService: ConfigService, localUploadStorage: LocalUploadStorage) => {
        const storage = configService.get<string>('upload.storage', 'local');

        switch (storage) {
          case 'local':
          default:
            return localUploadStorage;
        }
      }
    }
  ],
  exports: [UploadService, UPLOAD_STORAGE_TOKEN]
})
export class UploadModule {}
