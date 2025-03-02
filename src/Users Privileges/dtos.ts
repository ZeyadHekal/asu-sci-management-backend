import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserPrivilegesDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: UUID;
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

export class CreateStudentPrivilegesDto extends OmitType(CreateUserPrivilegesDto, ['userTypeId']) { }

export class UpdateUserPrivilegesDto extends PartialType(CreateUserPrivilegesDto) {}

export class UserPrivilegesDto extends OmitType(CreateUserPrivilegesDto, ['password']) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class UserListPrivilegesDto extends OmitType(UserPrivilegesDto, []) {}
