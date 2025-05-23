import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { CourseGroup } from '../courses/course-group.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { OmitType } from '@nestjs/swagger';

@Entity('student_courses')
@Index('idx_student_courses_course_id', ['courseId'])
@Index('idx_student_courses_student_id', ['studentId'])
@Index('idx_student_courses_course_group_id', ['courseGroupId'])
@Index('idx_student_courses_course_student', ['courseId', 'studentId'])
export class StudentCourses extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'student_id' })
	@Expose()
	studentId: UUID;

	@PrimaryColumn({ name: 'course_id' })
	@Expose()
	courseId: UUID;

	@Column({ nullable: true, name: 'course_group_id' })
	@Expose()
	courseGroupId?: UUID;

	@Column({ nullable: false, name: 'group_number' })
	@Expose()
	groupNumber: number;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => Student, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'student_id' })
	student: Promise<Student>;

	@ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;

	@ManyToOne(() => CourseGroup, { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'course_group_id' })
	courseGroup: Promise<CourseGroup>;

	// TODO: Implement if needed
	async getTotalDegree(): Promise<number> {
		return;
	}
}
