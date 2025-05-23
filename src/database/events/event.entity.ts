import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { EventSchedule } from './event_schedules.entity';

@Entity('events')
export class Event extends ManagementEntity {
	@Column({ nullable: false })
	@Expose()
	name: string;

	@Column()
	@Expose()
	duration: number;

	@Column({ nullable: false })
	@Expose()
	isExam: boolean;

	@Column({ nullable: false })
	@Expose()
	isInLab: boolean;

	@Column({ nullable: true })
	@Expose()
	examFiles?: string;

	@Column({ nullable: false })
	@Expose()
	degree: number;

	@Column({ nullable: false, default: false })
	@Expose()
	autoStart: boolean;

	@Column({ nullable: false, default: 30 })
	@Expose()
	examModeStartMinutes: number; // Minutes before exam to enter exam mode

	@Column({ nullable: true })
	@Expose()
	description?: string;

	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@OneToMany(() => EventSchedule, (schedule) => schedule.event, { lazy: true })
	schedules: Promise<EventSchedule[]>;
}
