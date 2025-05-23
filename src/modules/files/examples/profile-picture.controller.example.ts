import { Body, Controller, Get, Param, ParseIntPipe, Post, UploadedFile } from '@nestjs/common';
import { FileService } from '../file.service';
import { FileUpload, FileUploadOptions } from '../decorators/file-upload.decorator';
import { SignedUrl } from '../decorators/signed-url.decorator';
import { FileResponseDto, FileUploadDto } from '../dto/file.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * THIS IS AN EXAMPLE FILE - NOT FOR PRODUCTION USE
 * Shows how to use FileModule in other controllers
 */

@ApiTags('users')
@Controller('users')
export class UserProfileExampleController {
	constructor(private readonly fileService: FileService) {}

	@Post(':id/profile-picture')
	@ApiOperation({ summary: 'Upload user profile picture' })
	@FileUpload('profilePicture')
	async uploadProfilePicture(@Param('id', ParseIntPipe) userId: number, @UploadedFile() file: Express.Multer.File): Promise<FileResponseDto> {
		// Create file upload options
		const fileUploadDto: FileUploadOptions = {
			prefix: `users/${userId}/profile`,
			isPublic: false, // Keep it private for security
		};

		return this.fileService.uploadFile(file, fileUploadDto);
	}

	@Get(':id/profile-picture')
	@ApiOperation({ summary: 'Get user profile picture URL' })
	async getUserProfilePictureUrl(
		@Param('id', ParseIntPipe) userId: number,
		@SignedUrl() { expirySeconds }: { expirySeconds?: number },
	): Promise<{ pictureUrl: string }> {
		// In a real application, you would get the file ID from the user record
		// This is just for example purposes
		const fileId = 1; // Example file ID

		const url = await this.fileService.getSignedUrl(fileId, expirySeconds);
		return { pictureUrl: url };
	}
}
