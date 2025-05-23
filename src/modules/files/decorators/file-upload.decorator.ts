import { applyDecorators, UseInterceptors, SetMetadata } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { FileUploadInterceptor } from '../interceptors/file-upload.interceptor';

export const FILE_UPLOAD_OPTIONS = 'file_upload_options';

export interface FileUploadOptions {
	prefix?: string;
	isPublic?: boolean;
}

/**
 * Decorator for handling file upload
 * @param fieldName Name of the field in the form-data
 * @param fileOptions File upload options (prefix, isPublic)
 * @param options Multer options for file upload
 * @returns Decorator
 */
export function FileUpload(fieldName = 'file', fileOptions: FileUploadOptions = {}, options?: MulterOptions) {
	const defaultOptions: MulterOptions = {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB
		},
	};

	return applyDecorators(
		SetMetadata(FILE_UPLOAD_OPTIONS, fileOptions),
		UseInterceptors(FileUploadInterceptor, FileInterceptor(fieldName, options || defaultOptions)),
		ApiConsumes('multipart/form-data'),
	);
}
