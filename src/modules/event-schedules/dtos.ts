import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsDate, IsString, IsUUID } from 'class-validator';

export class CreateEventScheduleDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@IsDate()
	@Expose()
	dateTime: Date;

	@ApiProperty()
	@IsString()
	@Expose()
	examFiles: string;

	@ApiProperty()
	@IsUUID()
	@Expose()
	assisstantId: UUID;
}
export class UpdateEventScheduleDto extends PartialType(CreateEventScheduleDto) {}

export class EventScheduleDto extends OmitType(CreateEventScheduleDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class EventScheduleListDto extends OmitType(EventScheduleDto, []) {}

export class EventSchedulePagedDto implements IPaginationOutput<EventScheduleDto> {
	@ApiProperty({ type: () => EventScheduleDto })
	@Expose()
	items: EventScheduleDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class EventSchedulePaginationInput extends IntersectionType(PaginationInput, Entity) {}
