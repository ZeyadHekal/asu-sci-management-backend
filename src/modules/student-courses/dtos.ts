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
	courseName?: string;

	@ApiProperty()
	@Expose()
	groupCapacity?: number;

	@ApiProperty()
	@Expose()
	groupOrder?: number;
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
