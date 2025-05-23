import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FileDto {
	@ApiProperty({ description: 'File ID' })
	@IsNumber()
	id: number;

	@ApiProperty({ description: 'File name' })
	@IsString()
	filename: string;

	@ApiProperty({ description: 'Original file name' })
	@IsString()
	originalname: string;

	@ApiProperty({ description: 'File MIME type' })
	@IsString()
	mimetype: string;

	@ApiProperty({ description: 'File size in bytes' })
	@IsNumber()
	size: number;

	@ApiProperty({ description: 'File object name in storage' })
	@IsString()
	objectName: string;

	@ApiProperty({ description: 'File prefix/folder in storage', required: false })
	@IsOptional()
	@IsString()
	prefix?: string;

	@ApiProperty({ description: 'Storage bucket name' })
	@IsString()
	bucket: string;

	@ApiProperty({ description: 'File category', required: false })
	@IsOptional()
	@IsString()
	category?: string;

	@ApiProperty({ description: 'File description', required: false })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ description: 'Whether the file is publicly accessible' })
	@IsBoolean()
	isPublic: boolean;

	@ApiProperty({ description: 'File creation date' })
	createdAt: Date;

	@ApiProperty({ description: 'File last update date' })
	updatedAt: Date;
}

export class FileUploadDto {
	@ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
	file: any;
}

export class FileResponseDto extends FileDto {
	@ApiProperty({ description: 'Signed URL for accessing the file', required: false })
	@IsOptional()
	@IsString()
	url?: string;
}
