import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';

@Entity('labs')
@Index('idx_labs_created_at', ['created_at'])
@Index('idx_labs_supervisor_id', ['supervisorId'])
export class Lab extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column({ nullable: false })
	@Expose()
	location: string;

	@Column({ nullable: false, default: 30 })
	@Expose()
	capacity: number;

	@Column({ nullable: false, name: 'supervisor_id' })
	@Expose()
	supervisorId: UUID;

	@ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'supervisor_id' })
	supervisor: User;

	@OneToMany(() => Device, (device) => device.lab, { lazy: true })
	devices: Promise<Device[]>;
}
