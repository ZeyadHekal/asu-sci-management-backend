import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';

@Entity('materials')
export class Material extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column()
	@Expose()
	description: string;

	@Column()
	@Expose()
	attachments: string;

	@Column({ nullable: false })
	@Expose()
	isHidden: boolean;

	@Column({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;
}
