import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Lab } from '../labs/lab.entity';
import { User } from '../users/user.entity';
import { DeviceReport } from './devices_reports.entity';
import { report } from 'process';
import { DeviceSoftwares } from './devices_softwares.entity';

@Entity('devices')
export class Device extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	IPAddress: string;

	@Column({ default: false })
	@Expose()
	hasIssue: boolean;

	@Column({ nullable: false, name: 'lab_id' })
	@Expose()
	labId: UUID;

	@Column({ nullable: false, name: 'assisstant_id' })
	@Expose()
	assisstantId: UUID;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'assisstant_id' })
	user: Promise<User>;

	@OneToMany(() => DeviceReport, (report) => report.device, { lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	deviceReports: Promise<DeviceReport[]>;

	assignments: Promise<DeviceSoftwares[]>;
	__assignments__?: DeviceSoftwares[];
}

