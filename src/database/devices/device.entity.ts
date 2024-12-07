import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Lab } from '../labs/lab.entity';
import { User } from '../users/user.entity';
import { DeviceReport } from './devices_reports.entity';

@Entity('devices')
export class Device extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	IPAddress: string;

	@Column()
	@Expose()
	hasIssue: boolean;

	@Column({ nullable: false, name: 'lab_id' })
	@Expose()
	labId: UUID;

	@Column({ nullable: false, name: 'device_report_id' })
	@Expose()
	deviceReportId: UUID;

	@Column({ nullable: false, name: 'assisstant_id' })
	@Expose()
	assisstantId: UUID;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'assisstant_id' })
	user: Promise<User>;

	@ManyToOne(() => DeviceReport, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_report_id' })
	device_report: Promise<DeviceReport>;
}
