import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';

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

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class EventDto extends OmitType(CreateEventDto,['examFiles']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class EventListDto extends OmitType(EventDto, []) {}
