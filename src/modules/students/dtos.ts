import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IS_LENGTH, IsNumber, IsString, IsStrongPassword, IsUUID, Length, MinLength } from 'class-validator';
import { UUID } from 'crypto';

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

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class StudentDto extends OmitType(CreateStudentDto,['photo']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class StudentListDto extends OmitType(StudentDto, []) {}
