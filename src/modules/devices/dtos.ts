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

	@ApiProperty({ description: 'Total number of reports for this device' })
	@Expose()
	totalReports: number;

	@ApiProperty({ description: 'Number of non-closed (open) reports for this device' })
	@Expose()
	openReports: number;
}

export class DeviceSoftwareDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	hasIssue: boolean;

	@ApiProperty({ required: false })
	@Expose()
	issueDescription?: string;
}

export class DeviceDetailsDto {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	IPAddress: string;

	@ApiProperty()
	@Expose()
	hasIssue: boolean;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty()
	@Expose()
	created_at: Date;

	@ApiProperty()
	@Expose()
	updated_at: Date;

	@ApiProperty()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@Expose()
	labName: string;

	@ApiProperty()
	@Expose()
	labLocation?: string;

	@ApiProperty()
	@Expose()
	assisstantId: UUID;

	@ApiProperty()
	@Expose()
	assistantName: string;

	@ApiProperty()
	@Expose()
	assistantEmail?: string;

	@ApiProperty({ type: () => DeviceSpecificationDto, isArray: true })
	@Expose()
	@Type(() => DeviceSpecificationDto)
	specifications: DeviceSpecificationDto[];

	@ApiProperty({ type: () => DeviceSoftwareDto, isArray: true })
	@Expose()
	@Type(() => DeviceSoftwareDto)
	installedSoftware: DeviceSoftwareDto[];

	@ApiProperty()
	@Expose()
	totalReports: number;

	@ApiProperty()
	@Expose()
	totalMaintenanceRecords: number;

	@ApiProperty()
	@Expose()
	totalLoginSessions: number;

	@ApiProperty()
	@Expose()
	lastLoginDate?: Date;

	@ApiProperty()
	@Expose()
	lastMaintenanceDate?: Date;

	@ApiProperty()
	@Expose()
	lastReportDate?: Date;
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

export class AddDeviceSoftwareDto {
	@ApiProperty()
	@IsString()
	@Expose()
	softwareId: UUID;

	@ApiProperty({ required: false, description: 'Whether the software has issues' })
	@IsOptional()
	@IsBoolean()
	@Expose()
	hasIssue?: boolean;

	@ApiProperty({ required: false, description: 'Description of any issues' })
	@IsOptional()
	@IsString()
	@Expose()
	issueDescription?: string;
}

export class UpdateDeviceSoftwareDto {
	@ApiProperty({ required: false, description: 'Whether the software has issues' })
	@IsOptional()
	@IsBoolean()
	@Expose()
	hasIssue?: boolean;

	@ApiProperty({ required: false, description: 'Description of any issues' })
	@IsOptional()
	@IsString()
	@Expose()
	issueDescription?: string;
}

export class UpdateDeviceSoftwareListDto {
	@ApiProperty({ type: [String], description: 'Array of software IDs to install on the device' })
	@IsArray()
	@IsString({ each: true })
	@Expose()
	softwareIds: UUID[];
}

export class MaintenanceUpdateDto {
	@ApiProperty({ enum: ['available', 'not available'], description: 'Device availability status' })
	@IsString()
	@Expose()
	status: string;

	@ApiProperty({ required: false, description: 'Maintenance description' })
	@IsOptional()
	@IsString()
	@Expose()
	description?: string;

	@ApiProperty({ required: false, description: 'Resolution notes' })
	@IsOptional()
	@IsString()
	@Expose()
	resolutionNotes?: string;

	@ApiProperty({ required: false, description: 'Involved personnel' })
	@IsOptional()
	@IsString()
	@Expose()
	involvedPersonnel?: string;
}
