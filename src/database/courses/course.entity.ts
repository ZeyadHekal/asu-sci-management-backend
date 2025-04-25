import { Entity, Column, ManyToMany, JoinTable, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../users/user.entity';
import { Software } from '../softwares/software.entity';
import { OmitType } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { Device } from '../devices/device.entity';
import { Lab } from '../labs/lab.entity';

@Entity('courses')
export class Course extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column()
	@Expose()
	creditHours: number;

	@Column({ nullable: false })
	@Expose()
	subjectCode: string;

	@Column({ nullable: false })
	@Expose()
	courseNumber: number;

	@Column({ nullable: false })
	@Expose()
	hasLab: boolean;

	@Column({ nullable: false })
	@Expose()
	labDuration: string;

	@Column({ nullable: false })
	@Expose()
	attendanceMarks: number;

	@ManyToMany(() => User, (user) => user.courses, { lazy: true })
	users: Promise<User[]>;

	@ManyToMany(() => Software, (software) => software.courses, {
		lazy: true,
	})
	@JoinTable({ name: 'course_softwares' })
	softwares: Promise<Software[]>;
}

@Entity('doctor_courses')
export class DoctorCourse extends OmitType(ManagementEntity, ['id']) {

	@PrimaryColumn({ type: 'string' })
	doctor_id: UUID;

	@PrimaryColumn({ type: 'string' })
	course_id: UUID;

	@ManyToOne(() => Course, { lazy: true })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;
	__course__?: Course;

	@ManyToOne(() => User, (ut) => ut.userPrivileges, { lazy: true })
	@JoinColumn({ name: 'doctor_id' })
	doctor: Promise<User>;
	__doctor__?: User;
}

@Entity('student_courses')
export class StudentCourse extends OmitType(ManagementEntity, ['id']) {

	@PrimaryColumn({ type: 'string' })
	student_id: UUID;

	@PrimaryColumn({ type: 'string' })
	course_id: UUID;

	@ManyToOne(() => Course, { lazy: true })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;
	__course__?: Course;

	@ManyToOne(() => User, (ut) => ut.userPrivileges, { lazy: true })
	@JoinColumn({ name: 'student_id' })
	student: Promise<User>;
	__student__?: User;
}

@Entity('software_courses')
export class SoftwareCourse extends OmitType(ManagementEntity, ['id']) {

	@PrimaryColumn({ type: 'string' })
	software_id: UUID;

	@PrimaryColumn({ type: 'string' })
	course_id: UUID;

	@ManyToOne(() => User, { lazy: true })
	@JoinColumn({ name: 'course_id' })
	course: Promise<Course>;
	__course__?: Course;

	@ManyToOne(() => Software, (ut) => ut.softwareCourses, { lazy: true })
	@JoinColumn({ name: 'software_id' })
	software: Promise<Software>;
	__software__?: Software;
}
