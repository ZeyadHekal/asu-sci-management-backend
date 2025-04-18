import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { ManagementEntity } from 'src/base/base.entity';

@Entity('labs_sessions')
export class LabsSessions extends ManagementEntity {
	@Column({ name: 'course_id' })
	@Expose()
	courseId: UUID;

	@Column({ name: 'group_number' })
	@Expose()
	groupNumber: number;

	@Column()
	@Expose()
	date: Date;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;
}
