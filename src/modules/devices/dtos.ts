import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DeviceSpecificationDto {
	@ApiProperty()
	@IsString()
	@Expose()
	category: string;

	@ApiProperty()
	@IsString()
	@Expose()
	value: string;
}

export class CreateDeviceDto {
	@ApiProperty()
	@IsString()
	@Expose()
	IPAddress: string;

	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@IsString()
	@Expose()
	assisstantId: UUID;

	@ApiProperty({ type: [DeviceSpecificationDto], required: false })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => DeviceSpecificationDto)
	@Expose()
	specifications?: DeviceSpecificationDto[];
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}

export class DeviceDto extends OmitType(CreateDeviceDto, ['specifications']) {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	addedSince: Date;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty({ type: () => DeviceSpecificationDto, isArray: true })
	@Expose()
	@Type(() => DeviceSpecificationDto)
	specDetails: DeviceSpecificationDto[];
}

export class DeviceListDto extends DeviceDto {
	@ApiProperty()
	@Expose()
	labAssistant: string;

	@ApiProperty()
	@Expose()
	labName: string;
}

export class DevicePagedDto implements IPaginationOutput<DeviceListDto> {
	@ApiProperty({ type: () => DeviceListDto })
	@Expose()
	items: DeviceListDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class DevicePaginationInput extends PaginationInput {
	@ApiProperty({ required: false, description: 'Filter by device name' })
	@IsOptional()
	@IsString()
	@Expose()
	deviceName?: string;

	@ApiProperty({ required: false, description: 'Filter by software name' })
	@IsOptional()
	@IsString()
	@Expose()
	software?: string;

	@ApiProperty({ required: false, description: 'Filter by lab ID' })
	@IsOptional()
	@IsString()
	@Expose()
	labId?: UUID;

	@ApiProperty({ required: false, description: 'Filter by device status' })
	@IsOptional()
	@IsString()
	@Expose()
	status?: string;

	@ApiProperty({ required: false, description: 'Filter by lab assistant ID' })
	@IsOptional()
	@IsString()
	@Expose()
	assistantId?: UUID;

	@ApiProperty({ required: false, description: 'Filter by specification category' })
	@IsOptional()
	@IsString()
	@Expose()
	specCategory?: string;

	@ApiProperty({ required: false, description: 'Filter by specification value' })
	@IsOptional()
	@IsString()
	@Expose()
	specValue?: string;
}
