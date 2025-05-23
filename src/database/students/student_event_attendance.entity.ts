import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Student } from './student.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { OmitType } from '@nestjs/swagger';
import { EventSchedule } from '../events/event_schedules.entity';

@Entity('student_event_attendance')
export class StudentEventAttendance extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'student_id' })
	@Expose()
	studentId: UUID;

	@PrimaryColumn({ name: 'event_schedule_id' })
	@Expose()
	eventScheduleId: UUID;

	@Column({ type: 'boolean', default: false, name: 'is_attended' })
	@Expose()
	isAttended: boolean;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => Student, { nullable: false, lazy: true })
	@JoinColumn({ name: 'student_id' })
	student: Promise<Student>;

	@ManyToOne(() => EventSchedule, { nullable: false, lazy: true })
	@JoinColumn({ name: 'event_schedule_id' })
	eventSchedule: Promise<EventSchedule>;
}
