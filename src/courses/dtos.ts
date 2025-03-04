import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IS_LENGTH, IsBoolean, IsNumber, IsString, IsStrongPassword, IsUUID, Length, MinLength } from 'class-validator';
import { UUID } from 'crypto';

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

export class CourseDto extends OmitType(CreateCourseDto,[]) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class CourseListDto extends OmitType(CourseDto, []) {}
