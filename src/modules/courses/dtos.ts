import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IS_LENGTH, IsBoolean, IsNumber, IsString, IsStrongPassword, IsUUID, Length, MinLength } from 'class-validator';
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
	@Length(3)
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
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CourseDto extends OmitType(CreateCourseDto, []) {
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
	@Expose()
	courseType?: 'Practical' | 'Theory';

	@ApiProperty({ required: false, description: 'Filter by subject code' })
	@Expose()
	subjectCode?: string;

	@ApiProperty({ required: false, description: 'Search by course name or code' })
	@Expose()
	search?: string;
}
