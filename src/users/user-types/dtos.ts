import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { UserType } from 'src/database/users/user-type.entity';
import { GenericAssignPrivilegeDto, PrivilegeAssignmentDto } from 'src/privileges/dtos';

export class UserTypeBase {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Expose()
	description?: string;

	@ApiProperty({ required: false, default: true })
	@IsBoolean()
	@IsOptional()
	@Expose()
	isDeletable?: boolean;
}
export class CreateUserTypeDto extends UserTypeBase {
	@ApiProperty({ type: GenericAssignPrivilegeDto, isArray: true })
	@Type(() => GenericAssignPrivilegeDto)
	@IsArray()
	@Expose()
	privilege_assignments: GenericAssignPrivilegeDto[];
}

export class UpdateUserTypeDto extends PartialType(UserTypeBase) {}

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

export class UserTypePagedDto implements IPaginationOutput<UserTypeDto> {
	@ApiProperty({ type: () => UserTypeDto })
	@Expose()
	items: UserTypeDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class UserPaginationInput extends IntersectionType(PaginationInput, UserType) {}
