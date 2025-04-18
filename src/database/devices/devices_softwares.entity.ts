import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';
import { Device } from './device.entity';
import { Software } from '../softwares/software.entity';
import { DeviceReport } from './devices_reports.entity';

@Entity('device_softwares')
export class DeviceSoftwares extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'device_id' })
	@Expose()
	deviceId: UUID;

	@PrimaryColumn({ name: 'app_id' })
	@Expose()
	app_id: UUID;

	@Column()
	@Expose()
	hassIssue: boolean;

	@Column({ name: 'device_report_id' })
	@Expose()
	deviceReportId: UUID;

	@ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

	@ManyToOne(() => Software, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'app_id' })
	app: Promise<Software>;

	@ManyToOne(() => DeviceReport, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_report_id' })
	report: Promise<DeviceReport>;
}
