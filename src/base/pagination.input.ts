import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Allow, IsNumber } from 'class-validator';

export class PaginationInput {
	@ApiProperty({ default: 10, required: false })
	@IsNumber()
	@Transform(({ value }) => parseInt(value, 10))
	@Expose()
	@Allow()
	limit: number = 10;

	@ApiProperty({ default: 0, required: false })
	@IsNumber()
	@Transform(({ value }) => parseInt(value, 10))
	@Allow()
	@Expose()
	page: number = 0;

	@ApiProperty({ default: 'created_at', required: false })
	@Allow()
	@Expose()
	sortBy: string = 'created_at';

	@ApiProperty({ default: 'desc', enum: ['asc', 'desc'], required: false })
	@Allow()
	@Expose()
	sortOrder: 'asc' | 'desc' = 'desc';

	@ApiProperty({ required: false, isArray: true })
	@Allow()
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@Expose()
	ids?: string[] = [];
}
