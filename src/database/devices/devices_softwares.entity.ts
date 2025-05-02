import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';
import { Device } from './device.entity';
import { Software } from '../softwares/software.entity';
import { DeviceReport } from './devices_reports.entity';

@Entity('device_softwares')
export class DeviceSoftware extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'device_id' })
	@Expose()
	deviceId: UUID;

	@PrimaryColumn({ name: 'software_id' })
	@Expose()
	softwareId: UUID;

	@Column()
	@Expose()
	hasIssue: boolean;

	@Column({ name: 'device_report_id' })
	@Expose()
	deviceReportId: UUID;

	@ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

	@ManyToOne(() => Software, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'software_id' })
	software: Promise<Software>;

	@ManyToOne(() => DeviceReport, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_report_id' })
	report: Promise<DeviceReport>;
}
