import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { Student } from '../students/student.entity';
import { User } from '../users/user.entity';

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

	@ManyToMany(() => User, (user) => user.courses)
	users: User[];


}
