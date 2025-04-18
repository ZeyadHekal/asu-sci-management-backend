import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsBoolean, IsString } from 'class-validator';

export class CreateDeviceDto {
	@ApiProperty()
	@IsString()
	@Expose()
	IPAddress: string;

	@ApiProperty()
	@IsString()
	@Expose()
	labId: UUID;

	@ApiProperty()
	@IsString()
	@Expose()
	assisstantId: UUID;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) { }

export class DeviceDto extends OmitType(CreateDeviceDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class DeviceListDto extends OmitType(DeviceDto, []) { }

export class DevicePagedDto implements IPaginationOutput<DeviceDto> {
	@ApiProperty({ type: () => DeviceDto })
	@Expose()
	items: DeviceDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class DevicePaginationInput extends IntersectionType(PaginationInput, Entity) { }