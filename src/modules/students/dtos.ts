import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsString, IsNumber, Length } from 'class-validator';

export class CreateStudentDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	@Length(6)
	seatNo: number;

	@ApiProperty()
	@Expose()
	@IsNumber()
	level: number;

	@ApiProperty()
	@Expose()
	@IsString()
	program: string;

    @ApiProperty()
	@Expose()
	@IsString()
	photo: string;
}


export class UpdateStudentDto extends PartialType(CreateStudentDto) { }

export class StudentDto extends OmitType(CreateStudentDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class StudentListDto extends OmitType(StudentDto, []) { }

export class StudentPagedDto implements IPaginationOutput<StudentDto> {
	@ApiProperty({ type: () => StudentDto })
	@Expose()
	items: StudentDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class StudentPaginationInput extends IntersectionType(PaginationInput, Entity) { }