import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';

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

    @Column({ nullable: false})
	@Expose()
	examFiles: string;

    @Column({ nullable: false })
	@Expose()
	degree: number;

	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	userType: Promise<Course>;

}