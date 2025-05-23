import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MinioService } from './minio.service';
import { FileRepository } from './repositories/file.repository';
import { FileUploadInterceptor } from './interceptors/file-upload.interceptor';

@Module({
	imports: [ConfigModule, TypeOrmModule.forFeature([File])],
	controllers: [FileController],
	providers: [FileService, MinioService, FileRepository, FileUploadInterceptor],
	exports: [FileService, MinioService],
})
export class FileModule {}
