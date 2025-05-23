import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';
import { Device } from './device.entity';
import { Software } from '../softwares/software.entity';

@Entity('device_softwares')
export class DeviceSoftware extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'device_id' })
	@Expose()
	deviceId: UUID;

	@PrimaryColumn({ name: 'software_id' })
	@Expose()
	softwareId: UUID;

	@Column({ type: 'boolean', default: false, name: 'has_issue' })
	@Expose()
	hasIssue: boolean;

	@Column({ nullable: true })
	@Expose()
	issueDescription?: string;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

	@ManyToOne(() => Software, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'software_id' })
	software: Promise<Software>;
}
