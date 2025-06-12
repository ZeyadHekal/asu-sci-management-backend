import { UUID } from 'crypto';
import { PrivilegeCode } from '../db-seeder/data/privileges';
import { EntityName } from './entity-map';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class PrivilegeDto {
	@ApiProperty({ enum: PrivilegeCode })
	@Expose()
	code: PrivilegeCode;
	@ApiProperty()
	@Expose()
	friendlyName: string;
	@ApiProperty()
	@Expose()
	group: string;
	@ApiProperty()
	@Expose()
	requiresResource: boolean;
	@ApiPropertyOptional()
	@Expose()
	paramKey?: string;
	@ApiPropertyOptional()
	@Expose()
	entityName?: EntityName;
	@ApiProperty()
	@Expose()
	name: string;
	@ApiProperty()
	@Expose()
	key: string;
	@ApiProperty()
	@Expose()
	description: string;
	@ApiProperty()
	@Expose()
	category: string;
	@ApiProperty({ default: true })
	@Expose()
	isActive: boolean;
}
export class PrivilegeAssignmentDto extends PrivilegeDto {
	@ApiPropertyOptional({ isArray: true, type: 'string' })
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	@IsArray()
	@IsOptional()
	@Expose()
	resourceIds?: UUID[];
}

export class GenericAssignPrivilegeDto {
	@ApiProperty({ enum: PrivilegeCode, enumName: 'PrivilegeCode' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	privilegeCode: PrivilegeCode;
	@ApiPropertyOptional({ isArray: true, type: 'string' })
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	@IsArray()
	@IsOptional()
	@Expose()
	resourceIds?: UUID[];
}
export class UserAssignPrivilegeDto extends GenericAssignPrivilegeDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Expose()
	userId: UUID;
}
export class UserTypeAssignPrivilegeDto extends GenericAssignPrivilegeDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Expose()
	userTypeId: UUID;
}
