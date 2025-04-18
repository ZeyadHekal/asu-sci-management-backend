import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString } from 'class-validator';

export class CreateLabDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;
}


export class UpdateLabDto extends PartialType(CreateLabDto) { }

export class LabDto extends OmitType(CreateLabDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class LabListDto extends OmitType(LabDto, []) { }

export class LabPagedDto implements IPaginationOutput<LabDto> {
	@ApiProperty({ type: () => LabDto })
	@Expose()
	items: LabDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class LabPaginationInput extends IntersectionType(PaginationInput, Entity) { }