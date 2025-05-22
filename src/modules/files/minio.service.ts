import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private minioClient: Minio.Client;
    private bucketName: string;

    constructor(private readonly configService: ConfigService) {
        // Initialize Minio Client
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
            port: parseInt(this.configService.get<string>('MINIO_PORT')),
            useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
        });
        this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME');
    }

    async onModuleInit() {
        try {
            // Check if bucket exists
            const bucketExists = await this.minioClient.bucketExists(this.bucketName);
            if (!bucketExists) {
                // Create bucket if it doesn't exist
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(`Bucket '${this.bucketName}' created successfully`);
            } else {
                this.logger.log(`Bucket '${this.bucketName}' already exists`);
            }
        } catch (error) {
            this.logger.error(`Failed to initialize MinIO: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload a file to MinIO
     * @param file - File buffer and metadata
     * @param prefix - Optional folder prefix (e.g., 'users/', 'courses/')
     * @returns Object name in MinIO
     */
    async uploadFile(file: Express.Multer.File, prefix = ''): Promise<string> {
        try {
            const objectName = prefix
                ? `${prefix}/${Date.now()}-${file.originalname}`
                : `${Date.now()}-${file.originalname}`;

            await this.minioClient.putObject(
                this.bucketName,
                objectName,
                file.buffer,
                file.size,
                { 'Content-Type': file.mimetype }
            );

            return objectName;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate a presigned URL for an object
     * @param objectName - Object name in MinIO
     * @param expiry - URL expiry time in seconds (default from config)
     * @returns Presigned URL
     */
    async getPresignedUrl(objectName: string, expiry?: number): Promise<string> {
        try {
            const expiryTime = expiry || parseInt(
                this.configService.get<string>('MINIO_SIGNED_URL_EXPIRY', '3600')
            );

            return await this.minioClient.presignedGetObject(
                this.bucketName,
                objectName,
                expiryTime
            );
        } catch (error) {
            this.logger.error(`Failed to generate presigned URL: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete an object from MinIO
     * @param objectName - Object name in MinIO
     */
    async deleteFile(objectName: string): Promise<void> {
        try {
            await this.minioClient.removeObject(this.bucketName, objectName);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if object exists in MinIO
     * @param objectName - Object name in MinIO
     * @returns Boolean indicating if object exists
     */
    async objectExists(objectName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucketName, objectName);
            return true;
        } catch (error) {
            return false;
        }
    }
} 