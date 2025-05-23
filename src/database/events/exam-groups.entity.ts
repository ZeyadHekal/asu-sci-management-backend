import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Unique, Index, ManyToMany, JoinTable } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Event } from './event.entity';
import { CourseGroup } from '../courses/course-group.entity';
import { EventSchedule } from './event_schedules.entity';
import { ExamModel } from './exam-models.entity';

@Entity('exam_groups')
@Unique(['eventId', 'groupNumber'])
@Index('idx_exam_groups_event', ['eventId'])
export class ExamGroup extends ManagementEntity {
	@Column({ nullable: false, name: 'event_id' })
	@Expose()
	eventId: UUID;

	@Column({ nullable: false })
	@Expose()
	groupNumber: number;

	@Column({ nullable: false })
	@Expose()
	expectedStudentCount: number;

	@Column({ default: 0 })
	@Expose()
	actualStudentCount: number;

	@Column({ nullable: true })
	@Expose()
	notes?: string;

	@ManyToOne(() => Event, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'event_id' })
	event: Promise<Event>;

	@OneToMany(() => EventSchedule, (schedule) => schedule.examGroup, { lazy: true })
	schedules: Promise<EventSchedule[]>;

	@ManyToMany(() => ExamModel, (model) => model.assignedGroups, { lazy: true })
	@JoinTable({
		name: 'exam_group_models',
		joinColumn: { name: 'exam_group_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'exam_model_id', referencedColumnName: 'id' }
	})
	assignedModels: Promise<ExamModel[]>;
}
