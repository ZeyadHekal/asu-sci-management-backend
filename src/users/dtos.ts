import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsStrongPassword, IsUUID, MinLength, IsNumber, IsEmail, IsArray, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { User } from 'src/database/users/user.entity';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';

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

export class CreateStudentDto extends OmitType(CreateUserDto, ['userTypeId']) {
	@ApiProperty()
	@IsNumber()
	@Expose()
	seatNo: number;

	@ApiProperty()
	@IsNumber()
	@Expose()
	level: number;

	@ApiProperty()
	@IsString()
	@Expose()
	program: string;

	@ApiProperty({ type: 'string', format: 'binary', description: 'Student photo' })
	photo: any;
}

export class CreateStaffDto extends OmitType(CreateUserDto, ['userTypeId']) {
	@ApiProperty()
	@IsString()
	@Expose()
	title: string;

	@ApiProperty()
	@IsString()
	@Expose()
	department: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class UpdateStaffDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	name?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	username?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	password?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	title?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	@Expose()
	department?: string;

	@ApiProperty({ required: false, description: 'User type ID to change staff type' })
	@IsOptional()
	@IsUUID()
	@Expose()
	userTypeId?: UUID;
}

export class UserDto extends OmitType(CreateUserDto, ['password']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class StudentDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	username: string;

	@ApiProperty()
	@IsNumber()
	@Expose()
	seatNo: number;

	@ApiProperty()
	@IsNumber()
	@Expose()
	level: number;

	@ApiProperty()
	@IsString()
	@Expose()
	program: string;

	@ApiProperty({ description: 'Student photo ID' })
	@Expose()
	photo?: string;
}

export class StaffDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	username: string;

	@ApiProperty()
	@IsString()
	@Expose()
	title: string;

	@ApiProperty()
	@IsString()
	@Expose()
	department: string;

	@ApiProperty()
	@IsString()
	@Expose()
	userType: string;

	@ApiProperty()
	@IsUUID()
	@Expose()
	userTypeId: UUID;

	@ApiProperty()
	@IsBoolean()
	@Expose()
	status: boolean;

	@ApiProperty({ nullable: true, description: 'Last login date or null if never logged in' })
	@Expose()
	lastLogin: Date | null;

	@ApiProperty({ type: [String], description: 'All privileges (user type + user specific) - for compatibility' })
	@IsArray()
	@Expose()
	privileges: string[];

	@ApiProperty({ type: [String], description: 'Privileges inherited from user type (read-only)' })
	@IsArray()
	@Expose()
	userTypePrivileges: string[];

	@ApiProperty({ type: [String], description: 'User-specific privileges (editable)' })
	@IsArray()
	@Expose()
	userPrivileges: string[];
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

export class DoctorDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	username: string;

	@ApiProperty()
	@IsEmail()
	@Expose()
	email: string;

	@ApiProperty()
	@IsString()
	@Expose()
	title: string;

	@ApiProperty()
	@IsString()
	@Expose()
	department: string;

	@ApiProperty()
	@IsBoolean()
	@Expose()
	status: boolean;

	@ApiProperty()
	@Expose()
	lastLogin: Date;

	@ApiProperty({ type: [String], description: 'List of course codes the doctor teaches' })
	@IsArray()
	@Expose()
	assignedCourses: string[];
}

export class DoctorPagedDto implements IPaginationOutput<DoctorDto> {
	@ApiProperty({ type: () => DoctorDto })
	@Expose()
	items: DoctorDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class StaffPaginationInput extends PaginationInput {
	@ApiProperty({ required: false, description: 'Filter by department' })
	@IsOptional()
	@IsString()
	@Expose()
	department?: string;

	@ApiProperty({ required: false, description: 'Filter by user type name' })
	@IsOptional()
	@IsString()
	@Expose()
	userType?: string;

	@ApiProperty({ required: false, description: 'Filter by user status' })
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return undefined;
	})
	@Expose()
	status?: boolean;
}

export class UpdateUserPrivilegesDto {
	@ApiProperty({
		type: [String],
		enum: PrivilegeCode,
		description: 'Array of privilege codes to assign to the user',
		example: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE],
	})
	@IsArray()
	@IsEnum(PrivilegeCode, { each: true })
	@Expose()
	privileges: PrivilegeCode[];
}

export class UserPaginationInput extends IntersectionType(PaginationInput, User) {}
