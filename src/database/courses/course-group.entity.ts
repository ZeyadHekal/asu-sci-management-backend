import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from './course.entity';
import { Lab } from '../labs/lab.entity';

@Entity('course_groups')
@Unique(['courseId', 'order'])
@Unique(['courseId', 'groupNumber'])
@Index('idx_course_groups_course_default', ['courseId', 'isDefault'])
@Index('idx_course_groups_is_default', ['isDefault'])
@Index('idx_course_groups_course_id', ['courseId'])
@Index('idx_course_groups_lab_id', ['labId'])
export class CourseGroup extends ManagementEntity {
	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@Column({ nullable: false, name: 'group_number' })
	@Expose()
	groupNumber: number;

	@Column({ nullable: false })
	@Expose()
	order: number;

	@Column({ nullable: true, name: 'lab_id' })
	@Expose()
	labId?: UUID;

	@Column({ nullable: false, default: false })
	@Expose()
	isDefault: boolean;

	@Column({ nullable: true })
	@Expose()
	capacity?: number;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@ManyToOne(() => Lab, { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab?: Promise<Lab>;
}
