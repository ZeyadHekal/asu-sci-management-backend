import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../users/user.entity';
import { Software } from '../softwares/software.entity';

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
