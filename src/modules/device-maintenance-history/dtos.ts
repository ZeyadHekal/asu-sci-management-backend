import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { MaintenanceType, MaintenanceStatus } from 'src/database/devices/device-maintenance-history.entity';

export class CreateMaintenanceHistoryDto {
    @ApiProperty({ description: 'Device ID' })
    @IsUUID()
    @Expose()
    deviceId: UUID;

    @ApiProperty({ description: 'Technician ID' })
    @IsUUID()
    @Expose()
    technicianId: UUID;

    @ApiProperty({ description: 'Related report ID', required: false })
    @IsOptional()
    @IsUUID()
    @Expose()
    relatedReportId?: UUID;

    @ApiProperty({ enum: MaintenanceType, description: 'Type of maintenance' })
    @IsEnum(MaintenanceType)
    @Expose()
    maintenanceType: MaintenanceType;

    @ApiProperty({ enum: MaintenanceStatus, description: 'Maintenance status', default: MaintenanceStatus.SCHEDULED })
    @IsEnum(MaintenanceStatus)
    @Expose()
    status: MaintenanceStatus = MaintenanceStatus.SCHEDULED;

    @ApiProperty({ description: 'Maintenance description' })
    @IsString()
    @Expose()
    description: string;

    @ApiProperty({ description: 'Resolution notes', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    resolutionNotes?: string;

    @ApiProperty({ description: 'Scheduled date', required: false })
    @IsOptional()
    @IsDateString()
    @Expose()
    scheduledDate?: Date;

    @ApiProperty({ description: 'Start date', required: false })
    @IsOptional()
    @IsDateString()
    @Expose()
    startedAt?: Date;

    @ApiProperty({ description: 'Completion date', required: false })
    @IsOptional()
    @IsDateString()
    @Expose()
    completedAt?: Date;

    @ApiProperty({ description: 'Maintenance cost', required: false })
    @IsOptional()
    @IsNumber()
    @Expose()
    cost?: number;

    @ApiProperty({ description: 'Parts used in maintenance', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    partsUsed?: string;
}

export class UpdateMaintenanceHistoryDto extends PartialType(CreateMaintenanceHistoryDto) { }

export class MaintenanceHistoryDto extends CreateMaintenanceHistoryDto {
    @ApiProperty({ description: 'Maintenance history ID' })
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

    @ApiProperty({ description: 'Technician name', required: false })
    @Expose()
    technicianName?: string;

    @ApiProperty({ description: 'Related report description', required: false })
    @Expose()
    relatedReportDescription?: string;
}

export class MaintenanceHistoryListDto extends OmitType(MaintenanceHistoryDto, []) { }

export class MaintenanceHistoryPagedDto implements IPaginationOutput<MaintenanceHistoryListDto> {
    @ApiProperty({ type: [MaintenanceHistoryListDto] })
    @Expose()
    items: MaintenanceHistoryListDto[];

    @ApiProperty()
    @Expose()
    total: number;
}

export class MaintenanceHistoryPaginationInput extends PaginationInput {
    @ApiProperty({ required: false, description: 'Filter by device ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    deviceId?: UUID;

    @ApiProperty({ required: false, description: 'Filter by technician ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    technicianId?: UUID;

    @ApiProperty({ enum: MaintenanceStatus, required: false, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(MaintenanceStatus)
    @Expose()
    status?: MaintenanceStatus;

    @ApiProperty({ enum: MaintenanceType, required: false, description: 'Filter by maintenance type' })
    @IsOptional()
    @IsEnum(MaintenanceType)
    @Expose()
    maintenanceType?: MaintenanceType;

    @ApiProperty({ required: false, description: 'Filter by related report ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    relatedReportId?: UUID;
} 