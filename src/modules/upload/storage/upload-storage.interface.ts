export const UPLOAD_STORAGE_TOKEN = 'UPLOAD_STORAGE_TOKEN';

export interface UploadStorageSaveInput {
  file: Express.Multer.File;
  folder?: string;
}

export interface UploadStorageSaveResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
}

export interface UploadStorage {
  save(input: UploadStorageSaveInput): Promise<UploadStorageSaveResult>;
}
