import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Decorator for handling file upload
 * @param fieldName Name of the field in the form-data
 * @param options Multer options for file upload
 * @returns Decorator
 */
export function FileUpload(fieldName = 'file', options?: MulterOptions) {
    const defaultOptions: MulterOptions = {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
    };

    return applyDecorators(
        UseInterceptors(FileInterceptor(fieldName, options || defaultOptions)),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    [fieldName]: {
                        type: 'string',
                        format: 'binary',
                    },
                    category: {
                        type: 'string',
                        description: 'File category (optional)',
                    },
                    description: {
                        type: 'string',
                        description: 'File description (optional)',
                    },
                    isPublic: {
                        type: 'boolean',
                        description: 'Whether the file is publicly accessible (optional)',
                        default: false,
                    },
                    prefix: {
                        type: 'string',
                        description: 'File prefix/folder in storage (optional)',
                    },
                },
                required: [fieldName],
            },
        }),
    );
} 