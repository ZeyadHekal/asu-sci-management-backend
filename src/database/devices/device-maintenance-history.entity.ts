import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Device } from './device.entity';
import { User } from '../users/user.entity';
import { DeviceReport } from './devices_reports.entity';

export enum MaintenanceType {
    HARDWARE_REPAIR = 'HARDWARE_REPAIR',
    SOFTWARE_UPDATE = 'SOFTWARE_UPDATE',
    CLEANING = 'CLEANING',
    REPLACEMENT = 'REPLACEMENT',
    INSPECTION = 'INSPECTION',
    CALIBRATION = 'CALIBRATION',
    OTHER = 'OTHER',
}

export enum MaintenanceStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED',
}

@Entity('device_maintenance_history')
export class DeviceMaintenanceHistory extends ManagementEntity {
    @Column({ nullable: false, name: 'device_id' })
    @Expose()
    deviceId: UUID;

    @Column({ nullable: true, name: 'related_report_id' })
    @Expose()
    relatedReportId?: UUID;

    @Column({
        type: 'enum',
        enum: MaintenanceType,
        default: MaintenanceType.OTHER,
    })
    @Expose()
    maintenanceType: MaintenanceType;

    @Column({
        type: 'enum',
        enum: MaintenanceStatus,
        default: MaintenanceStatus.SCHEDULED,
    })
    @Expose()
    status: MaintenanceStatus;

    @Column({ type: 'text' })
    @Expose()
    description: string;

    @Column({ type: 'text', nullable: true })
    @Expose()
    resolutionNotes?: string;

    @Column({ nullable: true })
    @Expose()
    completedAt?: Date;

    @Column({ type: 'text', nullable: true })
    @Expose()
    involvedPersonnel?: string[];

    @ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'device_id' })
    device: Promise<Device>;

    @ManyToOne(() => DeviceReport, { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'related_report_id' })
    relatedReport?: Promise<DeviceReport>;
} 