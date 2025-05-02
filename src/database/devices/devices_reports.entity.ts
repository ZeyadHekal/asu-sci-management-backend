import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { User } from '../users/user.entity';
import { Device } from './device.entity';
import { Software } from '../softwares/software.entity';

@Entity('device_reports')
export class DeviceReport extends ManagementEntity {
	@Column()
	@Expose()
	description: string;

	@Column()
	@Expose()
	status: string;

	@Column()
	@Expose()
	fixMessage: UUID;

	@Column({ nullable: false, name: 'device_id' })
	@Expose()
	deviceId: UUID;

	@Column({ nullable: false, name: 'app_id' })
	@Expose()
	appId: UUID;

	@Column({ nullable: false, name: 'reporter_id' })
	@Expose()
	reporterId: UUID;

	@ManyToOne(() => Device, { nullable: true, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

	@ManyToOne(() => Software, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'app_id' })
	app: Promise<Software>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'reporter_id' })
	user: Promise<User>;
}
