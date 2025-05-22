import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { User } from 'src/database/users/user.entity';

export class CreateUserDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;
	@ApiProperty({ description: 'Username has to be 4 letters or more' })
	@Expose()
	@IsString()
	@MinLength(4)
	@Transform(({ value }) => (value as string).toLowerCase())
	username: string;
	@ApiProperty({ example: 'Abcd@1234' })
	@Expose()
	@IsStrongPassword({}, { message: 'Password must be at least of length 8 and includes numbers, lower and upper case letters and symbols.' })
	password: string;
	@ApiProperty()
	@IsUUID()
	@Expose()
	userTypeId: UUID;
}

export class CreateStudentDto extends OmitType(CreateUserDto, ['userTypeId']) { }

export class CreateStaffDto extends OmitType(CreateUserDto, ['userTypeId']) { }

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateStudentDto extends PartialType(CreateStudentDto) { }

export class UpdateStaffDto extends PartialType(CreateStaffDto) { }

export class UserDto extends OmitType(CreateUserDto, ['password']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class StudentDto extends UserDto {
	@ApiProperty()
	@Expose()
	userType: string;
}

export class StaffDto extends UserDto {
	@ApiProperty()
	@Expose()
	userType: string;
}

export class UserListDto extends OmitType(UserDto, []) {}

export class UserPagedDto implements IPaginationOutput<UserDto> {
	@ApiProperty({ type: () => UserDto })
	@Expose()
	items: UserDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class StudentPagedDto implements IPaginationOutput<StudentDto> {
	@ApiProperty({ type: () => StudentDto })
	@Expose()
	items: StudentDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class StaffPagedDto implements IPaginationOutput<StaffDto> {
	@ApiProperty({ type: () => StaffDto })
	@Expose()
	items: StaffDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class UserPaginationInput extends IntersectionType(PaginationInput, User) { }