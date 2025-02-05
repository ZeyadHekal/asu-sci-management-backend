import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { Course } from '../courses/course.entity';

@Entity('applications')
export class Application extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column()
	@Expose()
	requiredMemory: string;

	@Column()
	@Expose()
	requiredStorage: string;

	@ManyToMany(() => Course, (course) => course.applications, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'course_applications' })
	courses: Promise<Course[]>;
}
