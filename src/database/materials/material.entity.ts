import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable} from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { Application } from '../applications/application.entity';

@Entity('matetials')
export class Matetial extends ManagementEntity {
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

    
	@ManyToMany(() => Application, (application) => application.materials, {
		lazy: true,
	})
	@JoinTable({ name: 'course_applications' })
	applications: Promise<Application[]>;


	
}
