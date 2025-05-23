import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString, IsNumber, IsBoolean, IsUUID, IsOptional, IsArray, ValidateNested, IsDate } from 'class-validator';

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

	@ApiProperty({ required: false })
	@Expose()
	@IsString()
	@IsOptional()
	examFiles?: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	degree: number;

	@ApiProperty({ default: false })
	@IsBoolean()
	@Expose()
	@IsOptional()
	autoStart?: boolean;

	@ApiProperty({ default: 30 })
	@IsNumber()
	@Expose()
	@IsOptional()
	examModeStartMinutes?: number;

	@ApiProperty({ required: false })
	@IsString()
	@Expose()
	@IsOptional()
	description?: string;

	@ApiProperty()
	@IsUUID()
	@Expose()
	courseId: UUID;
}

export class CreateScheduleDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	courseGroupId: UUID;

	@ApiProperty({ required: false })
	@IsUUID()
	@IsOptional()
	@Expose()
	labId?: UUID;

	@ApiProperty()
	@IsDate()
	@Type(() => Date)
	@Expose()
	dateTime: Date;

	@ApiProperty()
	@IsUUID()
	@Expose()
	assistantId: UUID;

	@ApiProperty()
	@IsNumber()
	@Expose()
	maxStudents: number;
}

export class CreateExamGroupsDto {
	@ApiProperty({ type: [CreateScheduleDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateScheduleDto)
	@Expose()
	schedules: CreateScheduleDto[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class EventDto extends OmitType(CreateEventDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class EventListDto extends OmitType(EventDto, []) {}

export class EventPagedDto implements IPaginationOutput<EventDto> {
	@ApiProperty({ type: () => EventDto })
	@Expose()
	items: EventDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class GroupCalculationResultDto {
	@ApiProperty()
	@Expose()
	totalStudents: number;

	@ApiProperty()
	@Expose()
	requiredSessions: number;

	@ApiProperty()
	@Expose()
	groupDistribution: {
		courseGroupId: UUID;
		courseGroupName: string;
		studentCount: number;
		recommendedSessions: number;
		maxStudentsPerSession: number;
	}[];

	@ApiProperty()
	@Expose()
	labAvailability: {
		labId: UUID;
		labName: string;
		capacity: number;
		availableSlots: number;
	}[];
}

export class ExamModeStatusDto {
	@ApiProperty()
	@Expose()
	isInExamMode: boolean;

	@ApiProperty({ required: false })
	@Expose()
	examStartsIn?: number;

	@ApiProperty()
	@Expose()
	examSchedules: {
		eventScheduleId: UUID;
		eventName: string;
		dateTime: Date;
		status: string;
	}[];
}

export class EventPaginationInput extends IntersectionType(PaginationInput, Entity) {}
