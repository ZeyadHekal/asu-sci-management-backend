import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString } from 'class-validator';

export class CreateSoftwareDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	requiredMemory: string;

	@ApiProperty()
	@IsString()
	@Expose()
	requiredStorage: string;

}

export class UpdateSoftwareDto extends PartialType(CreateSoftwareDto) { }

export class SoftwareDto extends OmitType(CreateSoftwareDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class SoftwareListDto extends OmitType(SoftwareDto, []) { }

export class SoftwarePagedDto implements IPaginationOutput<SoftwareDto> {
	@ApiProperty({ type: () => SoftwareDto })
	@Expose()
	items: SoftwareDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class SoftwarePaginationInput extends IntersectionType(PaginationInput, Entity) { }