import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Privilege } from 'src/database/privileges/privilege.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { User } from '../users/user.entity';
import { Device } from './device.entity';
import { Application } from '../applications/application.entity';

@Entity('devices')
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

    @Column({ nullable: false, name: 'device_id'})
	@Expose()
	deviceId: UUID;

    @Column({ nullable: false, name: 'app_id'})
	@Expose()
	appId: UUID;

    @Column({ nullable: false, name: 'reporter_id' })
	@Expose()
	reporterId: UUID;

	@ManyToOne(() => Device, { nullable: true, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

    @ManyToOne(() => Application, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'app_id' })
	app: Promise<Application>;

    @ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'reporter_id' })
	user: Promise<User>;

}
