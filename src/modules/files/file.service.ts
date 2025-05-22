import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import { FileRepository } from './repositories/file.repository';
import { File } from './entities/file.entity';
import { FileResponseDto, FileUploadDto } from './dto/file.dto';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(
        private readonly minioService: MinioService,
        private readonly fileRepository: FileRepository,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Upload a file to storage and save metadata to database
     * @param file The uploaded file
     * @param fileUploadDto File upload options
     * @returns File metadata with signed URL
     */
    async uploadFile(
        file: Express.Multer.File,
        fileUploadDto: FileUploadDto = {},
    ): Promise<FileResponseDto> {
        try {
            const { category, description, isPublic = false, prefix = '' } = fileUploadDto;

            // Upload file to MinIO
            const objectName = await this.minioService.uploadFile(file, prefix);

            // Save file metadata to database
            const fileEntity = new File();
            fileEntity.filename = file.originalname.replace(/\s+/g, '_');
            fileEntity.originalname = file.originalname;
            fileEntity.mimetype = file.mimetype;
            fileEntity.size = file.size;
            fileEntity.objectName = objectName;
            fileEntity.prefix = prefix;
            fileEntity.bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
            fileEntity.category = category;
            fileEntity.description = description;
            fileEntity.isPublic = isPublic;

            const savedFile = await this.fileRepository.save(fileEntity);

            // Generate signed URL if not public
            const response: FileResponseDto = { ...savedFile };

            if (!isPublic) {
                response.url = await this.minioService.getPresignedUrl(objectName);
            }

            return response;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get file metadata by ID
     * @param id File ID
     * @param expirySeconds URL expiry time in seconds (optional)
     * @returns File metadata with signed URL
     */
    async getFileById(id: number, expirySeconds?: number): Promise<FileResponseDto> {
        const file = await this.fileRepository.findById(id);

        if (!file) {
            throw new NotFoundException(`File with ID ${id} not found`);
        }

        const response: FileResponseDto = { ...file };

        // Generate signed URL if not public
        if (!file.isPublic) {
            response.url = await this.minioService.getPresignedUrl(file.objectName, expirySeconds);
        }

        return response;
    }

    /**
     * Delete file by ID
     * @param id File ID
     */
    async deleteFile(id: number): Promise<void> {
        const file = await this.fileRepository.findById(id);

        if (!file) {
            throw new NotFoundException(`File with ID ${id} not found`);
        }

        // Delete file from MinIO
        await this.minioService.deleteFile(file.objectName);

        // Delete file metadata from database
        await this.fileRepository.delete(id);
    }

    /**
     * Generate signed URL for file access
     * @param id File ID
     * @param expirySeconds URL expiry time in seconds (optional)
     * @returns Signed URL
     */
    async getSignedUrl(id: number, expirySeconds?: number): Promise<string> {
        const file = await this.fileRepository.findById(id);

        if (!file) {
            throw new NotFoundException(`File with ID ${id} not found`);
        }

        return this.minioService.getPresignedUrl(file.objectName, expirySeconds);
    }
} 