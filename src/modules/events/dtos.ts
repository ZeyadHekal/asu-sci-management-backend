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

	@ApiProperty({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				courseGroupId: { type: 'string' },
				courseGroupName: { type: 'string' },
				studentCount: { type: 'number' },
				recommendedSessions: { type: 'number' },
				maxStudentsPerSession: { type: 'number' },
			},
		},
	})
	@Expose()
	groupDistribution: {
		courseGroupId: UUID;
		courseGroupName: string;
		studentCount: number;
		recommendedSessions: number;
		maxStudentsPerSession: number;
	}[];

	@ApiProperty({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				labId: { type: 'string' },
				labName: { type: 'string' },
				capacity: { type: 'number' },
				availableSlots: { type: 'number' },
			},
		},
	})
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

// New DTOs for enhanced functionality

export class SubmitFilesDto {
	@ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
	files: Express.Multer.File[];
}

export class FileSubmissionResponseDto {
	@ApiProperty()
	@Expose()
	message: string;

	@ApiProperty()
	@Expose()
	submittedFiles: string[];

	@ApiProperty()
	@Expose()
	submittedAt: Date;
}

export class UploadExamModelsDto {
	@ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
	examModels: Express.Multer.File[];
}

export class ExamModelsResponseDto {
	@ApiProperty()
	@Expose()
	message: string;

	@ApiProperty()
	@Expose()
	uploadedModels: string[];
}

export class StudentExamDataDto {
	@ApiProperty()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@Expose()
	studentName: string;

	@ApiProperty()
	@Expose()
	seatNo?: string;

	@ApiProperty()
	@Expose()
	submittedFiles: string[];

	@ApiProperty()
	@Expose()
	assignedExamModel?: string;

	@ApiProperty()
	@Expose()
	submittedAt?: Date;

	@ApiProperty()
	@Expose()
	mark?: number;
}

export class MarkEntryDto {
	@ApiProperty()
	@IsString()
	@Expose()
	studentName: string;

	@ApiProperty()
	@IsString()
	@Expose()
	seatNo: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	mark: number;
}

export class UploadMarksDto {
	@ApiProperty({ type: 'string', format: 'binary' })
	marksFile: Express.Multer.File;
}

export class MarkUploadResponseDto {
	@ApiProperty()
	@Expose()
	message: string;

	@ApiProperty()
	@Expose()
	processedStudents: number;

	@ApiProperty()
	@Expose()
	errors: string[];
}

export class GetAssignedExamModelDto {
	@ApiProperty()
	@Expose()
	examModel: string;

	@ApiProperty()
	@Expose()
	examModelUrl: string;
}
