import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { OmitType } from '@nestjs/swagger';
import { promises } from 'dns';
import { Courses_labs } from '../courses/course_labs.entity';

@Entity('student_course')
export class Student_courses extends OmitType(ManagementEntity,['id']){
	@PrimaryColumn({name:'student_id'})
	@Expose()
	studentId: UUID;

	@PrimaryColumn({name:'course_id'})
	@Expose()
	courseId: UUID;

	@Column({ nullable: false , name:'group_number'})
	@Expose()
	groupNumber: number;


	@ManyToOne(() => Student, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'student_id' })
	student:Promise<Student>;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course:Promise<Course>;


	//TODO: Implement if needed
	async getTotalDegree():Promise<number>{
		return ;
	}

}
