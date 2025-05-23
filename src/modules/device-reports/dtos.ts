import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';

export enum ReportStatus {
    PENDING_REVIEW = 'PENDING_REVIEW',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED'
}

// DTO for maintenance history in reports
export class ReportMaintenanceHistoryDto {
    @ApiProperty({ description: 'Maintenance history ID' })
    @Expose()
    id: UUID;

    @ApiProperty({ description: 'Maintenance type' })
    @Expose()
    maintenanceType: string;

    @ApiProperty({ description: 'Maintenance status' })
    @Expose()
    status: string;

    @ApiProperty({ description: 'Maintenance description' })
    @Expose()
    description: string;

    @ApiProperty({ description: 'Resolution notes', required: false })
    @Expose()
    resolutionNotes?: string;

    @ApiProperty({ description: 'Involved personnel', required: false })
    @Expose()
    involvedPersonnel?: string;

    @ApiProperty({ description: 'Completed at', required: false })
    @Expose()
    completedAt?: Date;

    @ApiProperty({ description: 'Created at' })
    @Expose()
    created_at: Date;

    @ApiProperty({ description: 'Updated at' })
    @Expose()
    updated_at: Date;
}

export class CreateDeviceReportDto {
    @ApiProperty({ description: 'Report description' })
    @IsString()
    @Expose()
    description: string;

    @ApiProperty({ description: 'Fix message', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    fixMessage?: string;

    @ApiProperty({ description: 'Device ID' })
    @IsUUID()
    @Expose()
    deviceId: UUID;

    @ApiProperty({ description: 'Software/App ID', required: false })
    @IsOptional()
    @IsUUID()
    @Expose()
    appId?: UUID;

    @ApiProperty({ description: 'Reporter ID', required: false })
    @IsOptional()
    @IsUUID()
    @Expose()
    reporterId?: UUID;
}

export class UpdateDeviceReportDto extends PartialType(CreateDeviceReportDto) {
    @ApiProperty({ enum: ReportStatus, description: 'Report status', default: ReportStatus.PENDING_REVIEW })
    @IsEnum(ReportStatus)
    @Expose()
    status: ReportStatus = ReportStatus.PENDING_REVIEW;
}

export class DeviceReportDto extends CreateDeviceReportDto {
    @ApiProperty({ description: 'Report ID' })
    @Expose()
    id: UUID;

    @ApiProperty({ enum: ReportStatus, description: 'Report status', default: ReportStatus.PENDING_REVIEW })
    @IsEnum(ReportStatus)
    @Expose()
    status: ReportStatus = ReportStatus.PENDING_REVIEW;

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

    @ApiProperty({ description: 'Resolution updates/maintenance history', required: false, type: [ReportMaintenanceHistoryDto] })
    @Expose()
    resolutionUpdates?: ReportMaintenanceHistoryDto[];
}

export class DeviceReportListDto extends OmitType(DeviceReportDto, []) { }

export class DeviceReportPagedDto implements IPaginationOutput<DeviceReportListDto> {
    @ApiProperty({ type: DeviceReportListDto, isArray: true })
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

    @ApiProperty({ required: false, description: 'Filter by lab ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    labId?: UUID;

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

    @ApiProperty({ required: false, description: 'Search across device names, descriptions, and reporter names' })
    @IsOptional()
    @IsString()
    @Expose()
    search?: string;

    @ApiProperty({ required: false, description: 'Filter by date from (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    @Expose()
    dateFrom?: string;

    @ApiProperty({ required: false, description: 'Filter by date to (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    @Expose()
    dateTo?: string;
} 