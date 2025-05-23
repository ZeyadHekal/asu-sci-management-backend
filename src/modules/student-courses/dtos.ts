import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';
import { PaginationInput } from 'src/base/pagination.input';

export class StudentCourseDto {
	@ApiProperty()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@Expose()
	courseId: UUID;

	@ApiProperty()
	@Expose()
	courseGroupId?: UUID;

	@ApiProperty()
	@Expose()
	groupNumber: number;

	@ApiProperty()
	@Expose()
	created_at: Date;

	@ApiProperty()
	@Expose()
	updated_at: Date;
}

export class StudentCourseListDto extends OmitType(StudentCourseDto, ['created_at', 'updated_at']) {
	@ApiProperty()
	@Expose()
	studentName?: string;

	@ApiProperty()
	@Expose()
	username?: string;

	@ApiProperty()
	@Expose()
	email?: string;

	@ApiProperty()
	@Expose()
	courseName?: string;

	@ApiProperty()
	@Expose()
	courseCode?: string;

	@ApiProperty()
	@Expose()
	credits?: number;

	@ApiProperty()
	@Expose()
	enrolledDate?: Date;

	@ApiProperty()
	@Expose()
	groupCapacity?: number;

	@ApiProperty()
	@Expose()
	groupOrder?: number;

	@ApiProperty()
	@Expose()
	groupName?: string;

	@ApiProperty({ description: 'Course type based on hasLab field' })
	@Expose()
	courseType?: 'Practical' | 'Theory';

	@ApiProperty({ description: 'Total number of enrolled students in course' })
	@Expose()
	numberOfStudents?: number;

	@ApiProperty({ description: 'Number of students in the same group' })
	@Expose()
	groupStudentsCount?: number;

	@ApiProperty({ description: 'Lab name where the group is assigned' })
	@Expose()
	labName?: string;

	@ApiProperty({ description: 'Lab room/location' })
	@Expose()
	labRoom?: string;

	@ApiProperty({ description: 'List of assigned doctor names', type: [String] })
	@Expose()
	assignedDoctors?: string[];

	@ApiProperty({ description: 'List of required software names', type: [String] })
	@Expose()
	requiredSoftware?: string[];
}

export class CreateStudentCourseDto {
	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	courseId: UUID;

	@ApiProperty({ required: false })
	@IsUUID()
	@IsOptional()
	@Expose()
	courseGroupId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@Expose()
	groupNumber?: number;
}

export class EnrollStudentDto {
	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	studentId: UUID;

	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	@Expose()
	courseId: UUID;
}

export class UpdateStudentCourseDto extends PartialType(CreateStudentCourseDto) {}

export class UpdateEnrollmentDto {
	@ApiProperty({ required: false })
	@IsUUID()
	@IsOptional()
	@Expose()
	courseGroupId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@Expose()
	groupNumber?: number;
}

export class StudentCoursePagedDto {
	@ApiProperty()
	@Expose()
	total: number;

	@ApiProperty({ type: [StudentCourseListDto] })
	@Expose()
	items: StudentCourseListDto[];
}

export class StudentCoursePaginationInput extends PaginationInput {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	courseId?: UUID;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsUUID()
	@Expose()
	studentId?: UUID;
}

// NEW: DTO for student weekly schedule
export class StudentWeeklyScheduleDto {
	@ApiProperty({ description: 'Course ID' })
	@Expose()
	courseId: UUID;

	@ApiProperty({ description: 'Course name' })
	@Expose()
	courseName: string;

	@ApiProperty({ description: 'Course code like "CS101"' })
	@Expose()
	courseCode: string;

	@ApiProperty({ description: 'Group name like "Group A"' })
	@Expose()
	groupName: string;

	@ApiProperty({ description: 'Lab name and location' })
	@Expose()
	labName: string;

	@ApiProperty({ description: 'Day of the week' })
	@Expose()
	weekDay: string;

	@ApiProperty({ description: 'Start time in HH:MM format' })
	@Expose()
	startTime: string;

	@ApiProperty({ description: 'End time in HH:MM format' })
	@Expose()
	endTime: string;

	@ApiProperty({ description: 'Teaching assistant names', type: [String] })
	@Expose()
	teachingAssistants: string[];
}

// NEW: DTO for available courses
export class AvailableCourseDto {
	@ApiProperty({ description: 'Course ID' })
	@Expose()
	id: UUID;

	@ApiProperty({ description: 'Course code like "CS101"' })
	@Expose()
	code: string;

	@ApiProperty({ description: 'Course name' })
	@Expose()
	name: string;

	@ApiProperty({ description: 'Credit hours' })
	@Expose()
	credits: number;
}
