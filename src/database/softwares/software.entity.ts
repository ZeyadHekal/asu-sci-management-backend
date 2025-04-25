import { Entity, Column, ManyToMany, JoinTable, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { Course } from '../courses/course.entity';
import { OmitType } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { Privilege } from '../privileges/privilege.entity';
import { UserType } from '../users/user-type.entity';
import { Device } from '../devices/device.entity';

@Entity('softwares')
export class Software extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column()
	@Expose()
	requiredMemory: string;

	@Column()
	@Expose()
	requiredStorage: string;

	@ManyToMany(() => Course, (course) => course.softwares, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'course_softwares' })
	courses: Promise<Course[]>;
}

@Entity('device_software_assignments')
export class DeviceSoftwareAssignment extends OmitType(ManagementEntity, ['id']) {

	@PrimaryColumn({ type: 'string' })
	device_id: UUID;

	@PrimaryColumn({ type: 'string' })
	software_id: UUID;

	@Column({ nullable: true })
	hasIssues: Boolean;

	@ManyToOne(() => Software, { lazy: true })
	@JoinColumn({ name: 'software_id' })
	software: Promise<Software>;
	__software__?: Software;

	@ManyToOne(() => Device, (ut) => ut.assignments, { lazy: true })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;
	__device__?: Device;
}
