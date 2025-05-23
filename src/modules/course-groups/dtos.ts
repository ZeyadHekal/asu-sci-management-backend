import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsString, IsArray } from 'class-validator';
import { UUID } from 'crypto';
import { PaginationInput } from 'src/base/pagination.input';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';

export class CourseGroupDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	courseId: UUID;

	@ApiProperty()
	@Expose()
	order: number;

	@ApiProperty()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@Expose()
	isDefault: boolean;

	@ApiProperty()
	@Expose()
	capacity?: number;

	@ApiProperty()
	@Expose()
	created_at: Date;

	@ApiProperty()
	@Expose()
	updated_at: Date;
}

export class CourseGroupListDto extends OmitType(CourseGroupDto, ['created_at', 'updated_at']) {
	@ApiProperty()
	@Expose()
	courseName?: string;

	@ApiProperty()
	@Expose()
	labName?: string;

	@ApiProperty()
	@Expose()
	currentEnrollment?: number;
}

// NEW: DTO for the course group schedule table
export class CourseGroupScheduleTableDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty({ description: 'Group name like "Group A", "Group B"' })
	@Expose()
	groupName: string;

	@ApiProperty({ description: 'Lab name and location' })
	@Expose()
	labName: string;

	@ApiProperty({ description: 'Day of the week' })
	@Expose()
	weekDay: string;

	@ApiProperty({ description: 'Time range for the lab session' })
	@Expose()
	timeSlot: string;

	@ApiProperty({ description: 'List of teaching assistant names' })
	@Expose()
	teachingAssistants: string[];

	@ApiProperty({ description: 'Current enrollment count' })
	@Expose()
	currentEnrollment: number;

	@ApiProperty({ description: 'Total capacity of the group' })
	@Expose()
	totalCapacity: number;

	@ApiProperty({ description: 'Lab ID for filtering' })
	@Expose()
	labId: UUID;

	@ApiProperty({ description: 'Course ID for reference' })
	@Expose()
	courseId: UUID;

	@ApiProperty({ description: 'Whether this is the default group' })
	@Expose()
	isDefault: boolean;
}

// NEW: DTO for creating course group schedules
export class CreateCourseGroupScheduleDto {
	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	courseGroupId: UUID;

	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	assistantId: UUID;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Expose()
	weekDay: string;

	@ApiProperty({ description: 'Start time in HH:MM format' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	startTime: string;

	@ApiProperty({ description: 'End time in HH:MM format' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	endTime: string;
}

export class UpdateCourseGroupScheduleDto extends PartialType(CreateCourseGroupScheduleDto) {}

export class CreateCourseGroupDto {
	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	courseId: UUID;

	@ApiProperty()
	@IsNumber()
	@IsNotEmpty()
	@Expose()
	order: number;

	@ApiProperty({ required: false, description: 'Lab ID - can be null if no lab assigned' })
	@IsUUID()
	@IsOptional()
	@Expose()
	labId?: UUID;

	@ApiProperty({ required: false })
	@IsBoolean()
	@IsOptional()
	@Expose()
	isDefault?: boolean;

	@ApiProperty({ required: false })
	@IsNumber()
	@IsOptional()
	@Expose()
	capacity?: number;
}

export class UpdateCourseGroupDto extends PartialType(CreateCourseGroupDto) {}

export class CourseGroupPaginationInput extends PaginationInput {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	courseId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	labId?: UUID;
}

// NEW: Pagination input for course group schedules table
export class CourseGroupScheduleTablePaginationInput extends PaginationInput {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	courseId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	labId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	weekDay?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	search?: string;
}

export class CourseGroupPagedDto implements IPaginationOutput<CourseGroupListDto> {
	@ApiProperty({ type: [CourseGroupListDto] })
	@Expose()
	items: CourseGroupListDto[];

	@ApiProperty()
	@Expose()
	total: number;
}
