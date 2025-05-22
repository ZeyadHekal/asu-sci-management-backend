import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Res,
    UploadedFile
} from '@nestjs/common';
import { Response } from 'express';
import { FileService } from './file.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileResponseDto, FileUploadDto } from './dto/file.dto';
import { FileUpload } from './decorators/file-upload.decorator';
import { SignedUrl } from './decorators/signed-url.decorator';

@ApiTags('files')
@Controller('files')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('upload')
    @FileUpload()
    @ApiOperation({ summary: 'Upload a file' })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: FileResponseDto
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() fileUploadDto: FileUploadDto,
    ): Promise<FileResponseDto> {
        return this.fileService.uploadFile(file, fileUploadDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get file metadata by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'File metadata retrieved successfully',
        type: FileResponseDto
    })
    async getFileById(
        @Param('id', ParseIntPipe) id: number,
        @SignedUrl() { expirySeconds }: { expirySeconds?: number },
    ): Promise<FileResponseDto> {
        return this.fileService.getFileById(id, expirySeconds);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download file by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    async downloadFile(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ): Promise<void> {
        const file = await this.fileService.getFileById(id);
        res.redirect(file.url);
    }

    @Get(':id/url')
    @ApiOperation({ summary: 'Get signed URL for file access' })
    @ApiParam({ name: 'id', description: 'File ID' })
    async getSignedUrl(
        @Param('id', ParseIntPipe) id: number,
        @SignedUrl() { expirySeconds }: { expirySeconds?: number },
    ): Promise<{ url: string }> {
        const url = await this.fileService.getSignedUrl(id, expirySeconds);
        return { url };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete file by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    async deleteFile(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ message: string }> {
        await this.fileService.deleteFile(id);
        return { message: 'File deleted successfully' };
    }
} 