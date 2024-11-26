import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeleteDto {
	@ApiPropertyOptional()
	@Expose()
	affected?: number;
}
