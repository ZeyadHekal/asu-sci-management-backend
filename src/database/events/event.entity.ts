import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { EventSchedule } from './event_schedules.entity';

export enum EventType {
	EXAM = 'exam',
	QUIZ = 'quiz',
	ASSIGNMENT = 'assignment',
	LAB_ASSIGNMENT = 'lab_assignment',
	PROJECT = 'project',
	PRESENTATION = 'presentation',
	WORKSHOP = 'workshop',
	PRACTICE = 'practice',
	SEMINAR = 'seminar'
}

export enum LocationType {
	LAB_DEVICES = 'lab_devices',
	LECTURE_HALL = 'lecture_hall',
	ONLINE = 'online',
	HYBRID = 'hybrid'
}

@Entity('events')
export class Event extends ManagementEntity {
	@Column({ nullable: false })
	@Expose()
	name: string;

	@Column({ nullable: true })
	@Expose()
	description?: string;

	@Column({ nullable: false })
	@Expose()
	duration: number;

	@Column({ type: 'enum', enum: EventType, default: EventType.ASSIGNMENT })
	@Expose()
	eventType: EventType;

	@Column({ type: 'enum', enum: LocationType, default: LocationType.ONLINE })
	@Expose()
	locationType: LocationType;

	@Column({ nullable: true })
	@Expose()
	customLocation?: string; // For when locationType is not lab_devices

	@Column({ nullable: false })
	@Expose()
	hasMarks: boolean;

	@Column({ nullable: true })
	@Expose()
	totalMarks?: number;

	@Column({ nullable: false, default: false })
	@Expose()
	autoStart: boolean;

	@Column({ nullable: false, default: 30 })
	@Expose()
	examModeStartMinutes: number;

	@Column({ type: 'timestamp', nullable: true })
	@Expose()
	startDateTime?: Date;

	@Column({ nullable: false, default: false })
	@Expose()
	requiresModels: boolean; // Whether this event uses exam models

	@Column({ nullable: false, default: false })
	@Expose()
	allowRandomModelAssignment: boolean;

	@Column({ nullable: false, default: false })
	@Expose()
	isExam: boolean; // Whether this event should be treated as an exam (independent of event type)

	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@OneToMany(() => EventSchedule, (schedule) => schedule.event, { lazy: true })
	schedules: Promise<EventSchedule[]>;

	// Computed properties
	get isInLab(): boolean {
		return this.locationType === LocationType.LAB_DEVICES;
	}

	get isOnline(): boolean {
		return this.locationType === LocationType.ONLINE;
	}
}
