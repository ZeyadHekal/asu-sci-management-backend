import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class CreateLabSessionDto {
	@ApiProperty()
	@IsString()
	@Expose()
	courseId: UUID;

	@ApiProperty()
	@IsNumber()
	@Expose()
	groupNumber: number;

	@ApiProperty()
	@IsDate()
	@Expose()
	date: Date;
}

export class UpdateLabSessionDto extends PartialType(CreateLabSessionDto) { }

export class LabSessionDto extends OmitType(CreateLabSessionDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class LabSessionListDto extends OmitType(LabSessionDto, []) { }

export class LabSessionPagedDto implements IPaginationOutput<LabSessionDto> {
	@ApiProperty({ type: () => LabSessionDto })
	@Expose()
	items: LabSessionDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class LabSessionPaginationInput extends IntersectionType(PaginationInput, Entity) { }