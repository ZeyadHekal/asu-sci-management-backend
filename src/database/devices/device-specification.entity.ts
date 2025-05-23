import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Device } from './device.entity';

@Entity('device_specifications')
export class DeviceSpecification extends ManagementEntity {
	@Column({ nullable: false })
	@Expose()
	category: string;

	@Column({ nullable: false })
	@Expose()
	value: string;

	@Column({ nullable: false, name: 'device_id' })
	@Expose()
	deviceId: UUID;

	@ManyToOne(() => Device, (device) => device.specifications, {
		nullable: false,
		lazy: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;
}
