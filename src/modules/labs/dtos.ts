import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString, IsUUID } from 'class-validator';
import { UserDto } from 'src/users/dtos';

export class CreateLabDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	location: string;

	@ApiProperty()
	@IsUUID()
	@Expose()
	supervisorId: UUID;
}

export class UpdateLabDto extends PartialType(CreateLabDto) {}

export class LabDto extends OmitType(CreateLabDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;

	@ApiProperty()
	@Expose()
	deviceCount: number;

	@ApiProperty({ type: () => UserDto })
	@Expose()
	supervisor: UserDto;
}

export class LabListDto extends OmitType(LabDto, []) {
	@ApiProperty({ enum: ['Available', 'In Use', 'Under Maintenance'] })
	@Expose()
	status: string;
}

export class LabPagedDto implements IPaginationOutput<LabListDto> {
	@ApiProperty({ type: [LabListDto] })
	@Expose()
	items: LabListDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class LabPaginationInput extends IntersectionType(PaginationInput, Entity) {}
