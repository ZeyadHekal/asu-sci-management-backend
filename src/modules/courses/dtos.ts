import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from './imports';
import { Course } from 'src/database/courses/course.entity';
import { PaginationInput } from 'src/base/pagination.input';

export class CreateCourseDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	creditHours: number;

	@ApiProperty()
	@IsString()
	@Expose()
	@Length(4)
	@Transform(({ value }) => (value as string).toUpperCase())
	subjectCode: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	@Min(100)
	@Max(999)
	courseNumber: number;

	@ApiProperty()
	@Expose()
	@IsBoolean()
	hasLab: boolean;

	@ApiProperty()
	@Expose()
	@IsString()
	labDuration: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	attendanceMarks: number;

	@ApiProperty({ type: [String], required: false, description: 'Array of doctor IDs to assign to this course' })
	@IsOptional()
	@IsArray()
	@IsUUID(4, { each: true })
	@Expose()
	doctorIds?: UUID[];

	@ApiProperty({ type: [String], required: false, description: 'Array of software IDs required for this course' })
	@IsOptional()
	@IsArray()
	@IsUUID(4, { each: true })
	@Expose()
	softwareIds?: UUID[];
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CourseDto extends OmitType(CreateCourseDto, ['doctorIds', 'softwareIds']) {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	created_at: Date;

	@ApiProperty()
	@Expose()
	updated_at: Date;
}

export class CourseDetailDto extends CourseDto {
	@ApiProperty({ description: 'Course code (subjectCode + courseNumber)' })
	@Expose()
	courseCode: string;

	@ApiProperty({ description: 'Course type based on hasLab field' })
	@Expose()
	courseType: 'Practical' | 'Theory';

	@ApiProperty({ description: 'List of assigned doctor names', type: [String] })
	@Expose()
	assignedDoctors: string[];

	@ApiProperty({ description: 'List of required software names', type: [String] })
	@Expose()
	requiredSoftware: string[];

	@ApiProperty({ description: 'Total number of enrolled students' })
	@Expose()
	numberOfStudents: number;

	@ApiProperty({ description: 'Indicates if course has default group created' })
	@Expose()
	hasDefaultGroup: boolean;
}

export class CourseListDto extends OmitType(CourseDto, ['created_at', 'updated_at']) {
	@ApiProperty({ description: 'Course code (subjectCode + courseNumber)' })
	@Expose()
	courseCode: string;

	@ApiProperty({ description: 'Course type based on hasLab field' })
	@Expose()
	courseType: 'Practical' | 'Theory';

	@ApiProperty({ description: 'List of assigned doctor names', type: [String] })
	@Expose()
	assignedDoctors: string[];

	@ApiProperty({ description: 'List of required software names', type: [String] })
	@Expose()
	requiredSoftware: string[];

	@ApiProperty({ description: 'Total number of enrolled students' })
	@Expose()
	numberOfStudents: number;

	@ApiProperty({ description: 'Indicates if course has default group created' })
	@Expose()
	hasDefaultGroup: boolean;
}

export class CoursePagedDto implements IPaginationOutput<CourseListDto> {
	@ApiProperty({ type: [CourseListDto] })
	@Expose()
	items: CourseListDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class CoursePaginationInput extends PaginationInput {
	@ApiProperty({ required: false, description: 'Filter by course type' })
	@IsOptional()
	@IsString()
	@Expose()
	courseType?: 'Practical' | 'Theory';

	@ApiProperty({ required: false, description: 'Filter by subject code' })
	@IsOptional()
	@IsString()
	@Expose()
	subjectCode?: string;

	@ApiProperty({ required: false, description: 'Search by course name or code' })
	@IsOptional()
	@IsString()
	@Expose()
	search?: string;
}
