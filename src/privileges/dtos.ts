import { UUID } from 'crypto';
import { PrivilegeCode } from './definition';
import { EntityName } from './entity-map';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class PrivilegeDto {
	@ApiProperty()
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
	@ApiProperty()
	@Expose()
	paramKey?: string;
	@ApiProperty()
	@Expose()
	entityName?: EntityName;
}

export class AssignPrivilegeDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Expose()
	userId: UUID;
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