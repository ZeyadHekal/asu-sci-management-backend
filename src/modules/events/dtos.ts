import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity, EventType, LocationType } from './imports';
import { IsString, IsNumber, IsBoolean, IsUUID, IsOptional, IsArray, ValidateNested, IsDate, IsDateString, IsEnum, Allow } from 'class-validator';

export class CreateEventDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Expose()
	description?: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	duration: number;

	@ApiProperty({ enum: EventType, default: EventType.ASSIGNMENT })
	@IsEnum(EventType)
	@Expose()
	eventType: EventType;

	@ApiProperty({ enum: LocationType, default: LocationType.ONLINE })
	@IsEnum(LocationType)
	@Expose()
	locationType: LocationType;

	@ApiProperty({ required: false, description: 'Custom location when not using lab devices' })
	@IsString()
	@IsOptional()
	@Expose()
	customLocation?: string;

	@ApiProperty()
	@IsBoolean()
	@Expose()
	hasMarks: boolean;

	@ApiProperty({ required: false })
	@IsNumber()
	@IsOptional()
	@Expose()
	totalMarks?: number;

	@ApiProperty({ default: false })
	@IsBoolean()
	@IsOptional()
	@Expose()
	autoStart?: boolean;

	@ApiProperty({ default: 30 })
	@IsNumber()
	@IsOptional()
	@Expose()
	examModeStartMinutes?: number;

	@ApiProperty({ required: false, type: Date, description: 'When the event should start' })
	@IsOptional()
	@Type(() => Date)
	@Expose()
	startDateTime?: Date;

	@ApiProperty({ default: false, description: 'Whether this event requires exam models' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	requiresModels?: boolean;

	@ApiProperty({ default: false, description: 'Allow random assignment of exam models to students' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	allowRandomModelAssignment?: boolean;

	@ApiProperty({ default: false, description: 'Whether this event should be treated as an exam' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	isExam?: boolean;

	@ApiProperty()
	@IsUUID()
	@Expose()
	courseId: UUID;
}

// Legacy support for compatibility
export class CreateEventLegacyDto {
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

	@ApiProperty({ description: 'Whether this event should be treated as an exam' })
	@Expose()
	isExam: boolean;

	@ApiProperty({ description: 'Computed: Whether this event is in lab' })
	@Expose()
	isInLab: boolean;

	@ApiProperty({ description: 'Computed: Whether this event is online' })
	@Expose()
	isOnline: boolean;

	// Legacy fields for backward compatibility
	@ApiProperty({ required: false, deprecated: true })
	@Expose()
	@IsOptional()
	examFiles?: string;

	@ApiProperty({ required: false, deprecated: true, description: 'Use totalMarks instead' })
	@Expose()
	@IsOptional()
	degree?: number;
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

export class ExamScheduleItemDto {
	@ApiProperty()
	@Expose()
	eventScheduleId: UUID;

	@ApiProperty()
	@Expose()
	eventName: string;

	@ApiProperty()
	@Expose()
	dateTime: Date;

	@ApiProperty()
	@Expose()
	status: string;
}

export class ExamModeStatusDto {
	@ApiProperty()
	@Expose()
	isInExamMode: boolean;

	@ApiProperty({ required: false })
	@Expose()
	examStartsIn?: number;

	@ApiProperty({
		type: [ExamScheduleItemDto],
		description: 'Array of exam schedules for the student'
	})
	@Expose()
	examSchedules: ExamScheduleItemDto[];
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

	@ApiProperty({ isArray: true })
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

	@ApiProperty({ isArray: true })
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

	@ApiProperty({ isArray: true })
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

	@ApiProperty({ isArray: true })
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

export class StudentExamDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	courseName: string;

	@ApiProperty()
	@Expose()
	courseCode: string;

	@ApiProperty()
	@Expose()
	dateTime: Date;

	@ApiProperty()
	@Expose()
	duration: number;

	@ApiProperty()
	@Expose()
	location: string;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty()
	@Expose()
	hasAccess: boolean;

	@ApiProperty({ required: false, isArray: true })
	@Expose()
	examFiles?: string[];

	@ApiProperty({ required: false })
	@Expose()
	groupId?: UUID;

	@ApiProperty({ required: false })
	@Expose()
	scheduleId?: UUID;

	@ApiProperty({ required: false })
	@Expose()
	submittedFiles?: string[];

	@ApiProperty({ required: false })
	@Expose()
	canSubmit?: boolean;
}

export class ProposedGroupDto {
	@ApiProperty()
	@Expose()
	courseGroupId: string;

	@ApiProperty()
	@Expose()
	courseGroupName: string;

	@ApiProperty()
	@Expose()
	currentStudentCount: number;

	@ApiProperty()
	@Expose()
	maxCapacity: number;

	@ApiProperty()
	@Expose()
	selectedLabId?: string;

	@ApiProperty()
	@Expose()
	selectedLabName?: string;

	@ApiProperty()
	@Expose()
	proposedCapacity: number;

	@ApiProperty()
	@Expose()
	hasSchedule: boolean;

	@ApiProperty()
	@Expose()
	scheduleDateTime?: Date;

	@ApiProperty({ required: false, description: 'Whether the proposed capacity exceeds lab capacity' })
	@Expose()
	isOverCapacity?: boolean;
}

export class LabAvailabilityDto {
	@ApiProperty()
	@Expose()
	labId: string;

	@ApiProperty()
	@Expose()
	labName: string;

	@ApiProperty()
	@Expose()
	totalCapacity: number;

	@ApiProperty()
	@Expose()
	availableCapacity: number;

	@ApiProperty({ isArray: true })
	@Expose()
	requiredSoftware: string[];

	@ApiProperty()
	@Expose()
	hasRequiredSoftware: boolean;
}

export class GroupCreationSimulationDto {
	@ApiProperty({ description: 'Total number of enrolled students in the course' })
	@Expose()
	totalStudents: number;

	@ApiProperty({ description: 'Number of groups needed to cover all students' })
	@Expose()
	requiredGroups: number;

	@ApiProperty({ description: 'List of proposed group distributions', type: ProposedGroupDto, isArray: true })
	@Expose()
	@Type(() => ProposedGroupDto)
	proposedGroups: ProposedGroupDto[];

	@ApiProperty({ description: 'Number of uncovered students' })
	@Expose()
	uncoveredStudents: number;

	@ApiProperty({ description: 'Can create event (no uncovered students)' })
	@Expose()
	canCreateEvent: boolean;

	@ApiProperty({ description: 'Available labs for group assignment', type: LabAvailabilityDto, isArray: true })
	@Expose()
	@Type(() => LabAvailabilityDto)
	availableLabs: LabAvailabilityDto[];
}

export class CreateEventWithGroupsDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Expose()
	description?: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	duration: number;

	@ApiProperty({ enum: EventType, default: EventType.ASSIGNMENT })
	@IsEnum(EventType)
	@Expose()
	eventType: EventType;

	@ApiProperty({ enum: LocationType, default: LocationType.ONLINE })
	@IsEnum(LocationType)
	@Expose()
	locationType: LocationType;

	@ApiProperty({ required: false, description: 'Custom location when not using lab devices' })
	@IsString()
	@IsOptional()
	@Expose()
	customLocation?: string;

	@ApiProperty()
	@IsBoolean()
	@Expose()
	hasMarks: boolean;

	@ApiProperty({ required: false })
	@IsNumber()
	@IsOptional()
	@Expose()
	totalMarks?: number;

	@ApiProperty({ default: false })
	@IsBoolean()
	@IsOptional()
	@Expose()
	autoStart?: boolean;

	@ApiProperty({ default: false, description: 'Whether this event requires exam models' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	requiresModels?: boolean;

	@ApiProperty({ default: false, description: 'Whether this event should be treated as an exam' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	isExam?: boolean;

	@ApiProperty({ default: 30 })
	@IsNumber()
	@IsOptional()
	@Expose()
	examModeStartMinutes?: number;

	@ApiProperty({ required: false, type: Date, description: 'When the event should start' })
	@IsOptional()
	@Type(() => Date)
	@Expose()
	startDateTime?: Date;

	@ApiProperty()
	@IsUUID()
	@Expose()
	courseId: UUID;

	@ApiProperty({ description: 'Proposed groups for the event', type: () => ProposedGroupSimpleDto, isArray: true })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProposedGroupSimpleDto)
	@Expose()
	proposedGroups: ProposedGroupSimpleDto[];

	@ApiProperty({ required: false, description: 'Exam models for the event (only for exams)', type: () => ExamModelForEventDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ExamModelForEventDto)
	@Expose()
	examModels?: ExamModelForEventDto[];

	@ApiProperty({ required: false, description: 'Model assignments to groups (only for exams)', type: () => GroupModelAssignmentDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => GroupModelAssignmentDto)
	@Expose()
	groupModelAssignments?: GroupModelAssignmentDto[];
}

export class ProposedGroupSimpleDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@IsNumber()
	@Expose()
	proposedCapacity: number;

	@ApiProperty({ default: false, description: 'Whether this group should auto-start the exam' })
	@IsBoolean()
	@IsOptional()
	@Expose()
	autoStart?: boolean;

	@ApiProperty({ description: 'Date and time for this group schedule' })
	@Type(() => Date)
	@Allow()
	@Expose()
	dateTime: Date;

	@ApiProperty({ description: 'Assistant IDs for this group', type: [String] })
	@IsArray()
	@IsUUID('4', { each: true })
	@Expose()
	assistantIds: UUID[];
}

export class GroupScheduleDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	courseGroupId: UUID;

	@ApiProperty()
	@IsUUID()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@IsDateString()
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

export class StudentGradesSummaryDto {
	@ApiProperty()
	@Expose()
	studentId: string;

	@ApiProperty()
	@Expose()
	studentName: string;

	@ApiProperty()
	@Expose()
	username: string;

	@ApiProperty()
	@Expose()
	seatNo: string;

	@ApiProperty()
	@Expose()
	totalMarks: number;

	@ApiProperty()
	@Expose()
	earnedMarks: number;

	@ApiProperty()
	@Expose()
	percentage: number;

	@ApiProperty({ type: () => EventMarkDto, isArray: true })
	@Expose()
	@Type(() => EventMarkDto)
	eventMarks: EventMarkDto[];
}

export class EventMarkDto {
	@ApiProperty()
	@Expose()
	eventId: string;

	@ApiProperty()
	@Expose()
	eventName: string;

	@ApiProperty()
	@Expose()
	eventScheduleId: string;

	@ApiProperty()
	@Expose()
	mark?: number;

	@ApiProperty()
	@Expose()
	totalMarks: number;

	@ApiProperty()
	@Expose()
	percentage?: number;

	@ApiProperty()
	@Expose()
	hasAttended: boolean;

	@ApiProperty()
	@Expose()
	dateTime: Date;
}

export class MoveStudentBetweenGroupsDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@IsUUID()
	@Expose()
	fromCourseGroupId: UUID;

	@ApiProperty()
	@IsUUID()
	@Expose()
	toCourseGroupId: UUID;

	@ApiProperty()
	@IsUUID()
	@Expose()
	courseId: UUID;
}

export class AddGroupToSimulationDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	labId: UUID;

	@ApiProperty({ required: false, description: 'Proposed capacity, defaults to lab effective capacity if not specified' })
	@IsNumber()
	@IsOptional()
	@Expose()
	proposedCapacity?: number;
}

export class RemoveGroupFromSimulationDto {
	@ApiProperty({ description: 'Index of the group to remove (0-based)' })
	@IsNumber()
	@Expose()
	groupIndex: number;
}

// Exam Model DTOs
export class ExamModelDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	version: string;

	@ApiProperty({ required: false })
	@Expose()
	description?: string;

	@ApiProperty()
	@Expose()
	fileName: string;

	@ApiProperty()
	@Expose()
	originalFileName: string;

	@ApiProperty()
	@Expose()
	fileSize: number;

	@ApiProperty()
	@Expose()
	mimeType: string;

	@ApiProperty()
	@Expose()
	assignedStudentCount: number;

	@ApiProperty()
	@Expose()
	isActive: boolean;

	@ApiProperty()
	@Expose()
	eventId: UUID;

	@ApiProperty()
	@Expose()
	fileUrl: string;

	@ApiProperty()
	@Expose()
	created_at: Date;

	@ApiProperty()
	@Expose()
	updated_at: Date;
}

export class CreateExamModelDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	version: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Expose()
	description?: string;

	@ApiProperty()
	@IsUUID()
	@Expose()
	eventId: UUID;
}

export class ExamModelAssignmentDto {
	@ApiProperty()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@Expose()
	studentName: string;

	@ApiProperty()
	@Expose()
	seatNo: string;

	@ApiProperty()
	@Expose()
	examModelId: UUID;

	@ApiProperty()
	@Expose()
	examModelName: string;

	@ApiProperty()
	@Expose()
	examModelVersion: string;

	@ApiProperty()
	@Expose()
	assignedAt: Date;
}

export class AssignExamModelsDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	eventId: UUID;

	@ApiProperty({ description: 'Array of model assignments', type: () => ModelAssignmentDto, isArray: true })
	@Expose()
	@Type(() => ModelAssignmentDto)
	@ValidateNested({ each: true })
	assignments: ModelAssignmentDto[];
}

export class ModelAssignmentDto {
	@ApiProperty()
	@IsUUID()
	@Expose()
	examModelId: UUID;

	@ApiProperty({ description: 'Array of student IDs to assign this model to', type: [String] })
	@IsArray()
	@IsUUID('4', { each: true })
	@Expose()
	studentIds: UUID[];
}

export class ExamModelForEventDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Expose()
	description?: string;

	@ApiProperty({ required: false, type: [String], description: 'Array of uploaded file IDs' })
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Expose()
	fileIds?: string[];
}

export class GroupModelAssignmentDto {
	@ApiProperty({ description: 'Index of the group (0-based)' })
	@IsNumber()
	@Expose()
	groupIndex: number;

	@ApiProperty({ description: 'Array of model names assigned to this group', type: [String] })
	@IsArray()
	@IsString({ each: true })
	@Expose()
	assignedModelNames: string[];
}

export class UploadedFileDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	originalName: string;

	@ApiProperty()
	@Expose()
	size: number;

	@ApiProperty()
	@Expose()
	mimeType: string;
}

export class UploadExamModelFilesResponseDto {
	@ApiProperty({ description: 'Array of uploaded file information', type: () => UploadedFileDto, isArray: true })
	@Expose()
	@Type(() => UploadedFileDto)
	uploadedFiles: UploadedFileDto[];
}
