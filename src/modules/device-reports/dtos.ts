import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';

export enum ReportStatus {
    REPORTED = 'REPORTED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CANCELLED = 'CANCELLED',
}

export class CreateDeviceReportDto {
    @ApiProperty({ description: 'Report description' })
    @IsString()
    @Expose()
    description: string;

    @ApiProperty({ enum: ReportStatus, description: 'Report status', default: ReportStatus.REPORTED })
    @IsEnum(ReportStatus)
    @Expose()
    status: ReportStatus = ReportStatus.REPORTED;

    @ApiProperty({ description: 'Fix message', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    fixMessage?: string;

    @ApiProperty({ description: 'Device ID' })
    @IsUUID()
    @Expose()
    deviceId: UUID;

    @ApiProperty({ description: 'Software/App ID' })
    @IsUUID()
    @Expose()
    appId: UUID;

    @ApiProperty({ description: 'Reporter ID', required: false })
    @IsOptional()
    @IsUUID()
    @Expose()
    reporterId?: UUID;
}

export class UpdateDeviceReportDto extends PartialType(CreateDeviceReportDto) { }

export class DeviceReportDto extends CreateDeviceReportDto {
    @ApiProperty({ description: 'Report ID' })
    @Expose()
    id: UUID;

    @ApiProperty({ description: 'Created at' })
    @Expose()
    created_at: Date;

    @ApiProperty({ description: 'Updated at' })
    @Expose()
    updated_at: Date;

    @ApiProperty({ description: 'Device name', required: false })
    @Expose()
    deviceName?: string;

    @ApiProperty({ description: 'Software name', required: false })
    @Expose()
    softwareName?: string;

    @ApiProperty({ description: 'Reporter name', required: false })
    @Expose()
    reporterName?: string;
}

export class DeviceReportListDto extends OmitType(DeviceReportDto, []) { }

export class DeviceReportPagedDto implements IPaginationOutput<DeviceReportListDto> {
    @ApiProperty({ type: [DeviceReportListDto] })
    @Expose()
    items: DeviceReportListDto[];

    @ApiProperty()
    @Expose()
    total: number;
}

export class DeviceReportPaginationInput extends PaginationInput {
    @ApiProperty({ required: false, description: 'Filter by device ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    deviceId?: UUID;

    @ApiProperty({ required: false, description: 'Filter by reporter ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    reporterId?: UUID;

    @ApiProperty({ enum: ReportStatus, required: false, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(ReportStatus)
    @Expose()
    status?: ReportStatus;

    @ApiProperty({ required: false, description: 'Filter by software ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    appId?: UUID;
} 