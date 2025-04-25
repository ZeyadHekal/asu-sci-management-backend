import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Lab } from '../labs/lab.entity';
import { Event } from './event.entity';
import { User } from '../users/user.entity';
import { OmitType } from '@nestjs/swagger';
import { Device } from '../devices/device.entity';
import { Software } from '../softwares/software.entity';

@Entity('event_schedules')
export class EventSchedule extends ManagementEntity {
	@Column({ name: 'event_id' })
	@Expose()
	eventId: UUID;

	@Column({ name: 'lab_id' })
	@Expose()
	labId: UUID;

	@Column()
	@Expose()
	dateTime: Date;

	@Column()
	@Expose()
	examFiles: string;

	@Column({ name: 'assisstant_id' })
	@Expose()
	assisstantId: UUID;

	@ManyToOne(() => Event, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'event_id' })
	event: Promise<Event>;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToMany(() => User, (user) => user.event_schedules, {
		lazy: true,
	})
	@JoinTable({ name: 'event_schedules_assisstance' })
	assisstant: Promise<User[]>;
}

@Entity('student_event_schedules')
export class StudentEventSchedule extends OmitType(ManagementEntity, ['id']) {

	@PrimaryColumn({ type: 'string' })
	eventSchedule_id: UUID;

	@PrimaryColumn({ type: 'string' })
	student_id: UUID;

	@Column({ nullable: true })
	hasAttended: Boolean;

	@Column({ nullable: true })
	examModel: String;

	@Column({ nullable: true })
	seatNo: String;

	@ManyToOne(() => EventSchedule, { lazy: true })
	@JoinColumn({ name: 'eventSchedule_id' })
	eventSchedule: Promise<EventSchedule>;
	__eventSchedule__?: EventSchedule;

	@ManyToOne(() => User, (ut) => ut.userPrivileges, { lazy: true })
	@JoinColumn({ name: 'student_id' })
	student: Promise<Device>;
	__student__?: Device;
}
