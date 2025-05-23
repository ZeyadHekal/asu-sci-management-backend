import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, PrimaryColumn, OneToMany } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Lab } from '../labs/lab.entity';
import { Event } from './event.entity';
import { User } from '../users/user.entity';
import { OmitType } from '@nestjs/swagger';
import { Device } from '../devices/device.entity';
import { Software } from '../softwares/software.entity';

export enum ExamStatus {
	SCHEDULED = 'scheduled',
	EXAM_MODE_ACTIVE = 'exam_mode_active',
	STARTED = 'started',
	ENDED = 'ended',
	CANCELLED = 'cancelled',
}

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

	@Column({ nullable: true })
	@Expose()
	examFiles?: string;

	@Column({ name: 'assistant_id' })
	@Expose()
	assistantId: UUID;

	@Column({
		type: 'enum',
		enum: ExamStatus,
		default: ExamStatus.SCHEDULED,
	})
	@Expose()
	status: ExamStatus;

	@Column({ nullable: true })
	@Expose()
	actualStartTime?: Date;

	@Column({ nullable: true })
	@Expose()
	actualEndTime?: Date;

	@Column({ nullable: true })
	@Expose()
	examModeStartTime?: Date;

	@Column({ default: 0 })
	@Expose()
	maxStudents: number;

	@Column({ default: 0 })
	@Expose()
	enrolledStudents: number;

	@Column({ nullable: true, name: 'exam_group_id' })
	@Expose()
	examGroupId?: UUID;

	@ManyToOne(() => Event, (event) => event.schedules, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'event_id' })
	event: Promise<Event>;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'assistant_id' })
	assistant: Promise<User>;

	@ManyToOne('ExamGroup', { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'exam_group_id' })
	examGroup?: Promise<any>;

	@OneToMany(() => StudentEventSchedule, (studentSchedule) => studentSchedule.eventSchedule, { lazy: true })
	studentSchedules: Promise<StudentEventSchedule[]>;
}

@Entity('student_event_schedules')
export class StudentEventSchedule extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ type: 'string' })
	eventSchedule_id: UUID;

	@PrimaryColumn({ type: 'string' })
	student_id: UUID;

	@Column({ nullable: true })
	@Expose()
	hasAttended?: boolean;

	@Column({ nullable: true })
	@Expose()
	examModel?: string;

	@Column({ nullable: true })
	@Expose()
	seatNo?: string;

	@Column({ nullable: true })
	@Expose()
	mark?: number;

	@Column({ nullable: true })
	@Expose()
	submittedAt?: Date;

	@Column({ default: false })
	@Expose()
	isInExamMode: boolean;

	@Column({ nullable: true })
	@Expose()
	examModeEnteredAt?: Date;

	@Column({ nullable: true })
	@Expose()
	examStartedAt?: Date;

	@ManyToOne(() => EventSchedule, (schedule) => schedule.studentSchedules, { lazy: true })
	@JoinColumn({ name: 'eventSchedule_id' })
	eventSchedule: Promise<EventSchedule>;

	@ManyToOne(() => User, { lazy: true })
	@JoinColumn({ name: 'student_id' })
	student: Promise<User>;
}
