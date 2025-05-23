import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { OmitType } from '@nestjs/swagger';
import { Lab } from '../labs/lab.entity';
import { User } from '../users/user.entity';
import { CourseGroup } from './course-group.entity';

@Entity('course_group_schedules')
@Index('idx_course_group_schedules_course_group', ['courseGroupId'])
@Index('idx_course_group_schedules_course', ['courseId'])
@Index('idx_course_group_schedules_assistant', ['assistantId'])
@Index('idx_course_group_schedules_week_day', ['weekDay'])
export class CourseGroupSchedule extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ nullable: false, name: 'course_group_id' })
	@Expose()
	courseGroupId: UUID;

	@PrimaryColumn({ nullable: false, name: 'assistant_id' })
	@Expose()
	assistantId: UUID;

	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@Column({ nullable: true, name: 'lab_id' })
	@Expose()
	labId?: UUID;

	@Column({ nullable: false })
	@Expose()
	weekDay: string;

	@Column({ type: 'time', nullable: false })
	@Expose()
	startTime: string;

	@Column({ type: 'time', nullable: false })
	@Expose()
	endTime: string;

	@ManyToOne(() => CourseGroup, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_group_id' })
	courseGroup: Promise<CourseGroup>;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@ManyToOne(() => Lab, { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab?: Promise<Lab>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'assistant_id' })
	assistant: Promise<User>;
}
