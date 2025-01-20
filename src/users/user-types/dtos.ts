import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { GenericAssignPrivilegeDto, PrivilegeAssignmentDto } from 'src/privileges/dtos';

export class UserTypeBase {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;
}
export class CreateUserTypeDto extends UserTypeBase {
	@ApiProperty({ type: GenericAssignPrivilegeDto, isArray: true })
	@Type(() => GenericAssignPrivilegeDto)
	@IsArray()
	@Expose()
	privilege_assignments: GenericAssignPrivilegeDto[];
}

export class UpdateUserTypeDto extends PartialType(UserTypeBase) { }

export class UserTypeDto extends UserTypeBase {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class UserTypeWithPrivilegeDto extends UserTypeDto {
	@ApiProperty({ type: PrivilegeAssignmentDto, isArray: true })
	@Expose()
	privileges: PrivilegeAssignmentDto[];
}
