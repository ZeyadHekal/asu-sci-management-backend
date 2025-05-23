# File Module

This module provides file upload, management, and secure access capabilities using MinIO as the object storage backend.

## Features

- File upload with metadata
- Secure file storage with private access by default
- Signed URLs for secure time-limited access
- Custom decorators for easy file handling
- Database tracking of file metadata

## Configuration

Configure MinIO in your environment file:

```bash
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=asu-sci-management
MINIO_SIGNED_URL_EXPIRY=3600
```

## Usage

### Basic File Upload

```typescript
import { Controller, Post, UploadedFile } from '@nestjs/common';
import { FileService } from '../files/file.service';
import { FileUpload } from '../files/decorators/file-upload.decorator';
import { FileResponseDto } from '../files/dto/file.dto';

@Controller('example')
export class ExampleController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @FileUpload()
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    return this.fileService.uploadFile(file);
  }
}
```

### Upload with Custom Options

```typescript
@Post('upload-with-options')
@FileUpload()
async uploadFileWithOptions(
  @UploadedFile() file: Express.Multer.File,
  @Body() fileUploadDto: FileUploadDto,
): Promise<FileResponseDto> {
  return this.fileService.uploadFile(file, fileUploadDto);
}
```

### Getting a Signed URL

```typescript
@Get('file/:id/url')
async getSignedUrl(
  @Param('id', ParseIntPipe) id: number,
  @SignedUrl() { expirySeconds }: { expirySeconds?: number },
): Promise<{ url: string }> {
  const url = await this.fileService.getSignedUrl(id, expirySeconds);
  return { url };
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /files/upload | Upload a new file |
| GET    | /files/:id | Get file metadata by ID |
| GET    | /files/:id/download | Download file by ID |
| GET    | /files/:id/url | Get signed URL for file access |
| DELETE | /files/:id | Delete file by ID |

## Custom Decorators

### FileUpload

This decorator simplifies file uploads by handling the file interceptor and swagger documentation:

```typescript
@Post('upload')
@FileUpload('profilePic')
async upload(@UploadedFile() file: Express.Multer.File) {
  // Your code here
}
```

### SignedUrl

This decorator extracts signed URL parameters from the request:

```typescript
@Get('file/:id')
async getFile(
  @Param('id') id: number,
  @SignedUrl() { expirySeconds }: { expirySeconds?: number },
) {
  // Access expirySeconds parameter
}
``` 