import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { OmitType } from '@nestjs/swagger';
import { Lab } from '../labs/lab.entity';
import { User } from '../users/user.entity';

@Entity('courses_labs')
export class CoursesLabs extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ nullable: false, name: 'course_id' })
	@Expose()
	courseId: UUID;

	@PrimaryColumn({ name: 'group_number' })
	@Expose()
	groupNumber: number;

	@Column({ nullable: false, name: 'assistant_id' })
	@Expose()
	assistantId: number;

	@Column()
	@Expose()
	weekDay: string;

	@Column()
	@Expose()
	time: Date;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'assisstant_id' })
	assisstant: Promise<User>;
}
