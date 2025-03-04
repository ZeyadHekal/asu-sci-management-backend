import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';

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

export class EventScheduleDto extends OmitType(CreateEventScheduleDto,['examFiles']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class EventScheduleListDto extends OmitType(EventScheduleDto, []) {}
