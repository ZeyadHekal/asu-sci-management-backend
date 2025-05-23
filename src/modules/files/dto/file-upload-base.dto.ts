import { ApiProperty } from '@nestjs/swagger';

/**
 * Base DTO for file uploads that can be extended by other DTOs
 */
export class FileUploadBaseDto {
	@ApiProperty({ type: 'string', format: 'binary' })
	file: any;
}
