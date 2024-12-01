import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Matetial } from '../materials/material.entity';
import { Event } from '../events/event.entity';

@Entity('students_files')
export class Students_files extends ManagementEntity{
	@PrimaryColumn({name:'student_id'})
	@Expose()
	studentId: UUID;

	@PrimaryColumn({name:'course_id'})
	@Expose()
	courseId: UUID;

	@Column({name:'event_id'})
	@Expose()
	eventId: UUID;

    @Column({name:'material_id'})
	@Expose()
	materialId: UUID;

    @Column()
	@Expose()
	files: string;

    @Column()
	@Expose()
	date: Date;


	@ManyToOne(() => Student, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'student_id' })
	student:Promise<Student>;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course:Promise<Course>;

    @ManyToOne(() => Matetial, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'material_id' })
	material:Promise<Matetial>;

    @ManyToOne(() => Event, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'event_id' })
	event:Promise<Event>;
}
