import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export class CreateEventDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	duration: number;

	@ApiProperty()
	@Expose()
	@IsBoolean()
	isExam: boolean;

    @ApiProperty()
	@Expose()
	@IsBoolean()
	isInLab: boolean;

	@ApiProperty()
	@Expose()
	@IsString()
	examFiles: string;

    @ApiProperty()
	@IsNumber()
	@Expose()
	degree: number;

	@ApiProperty()
	@IsUUID()
	@Expose()
	courseId: UUID;
}


export class UpdateEventDto extends PartialType(CreateEventDto) { }

export class EventDto extends OmitType(CreateEventDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class EventListDto extends OmitType(EventDto, []) { }

export class EventPagedDto implements IPaginationOutput<EventDto> {
	@ApiProperty({ type: () => EventDto })
	@Expose()
	items: EventDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class EventPaginationInput extends IntersectionType(PaginationInput, Entity) { }