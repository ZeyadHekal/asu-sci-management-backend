import { Entity, Column, ManyToMany, JoinTable, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { Course, SoftwareCourseAssignment } from '../courses/course.entity';
import { OmitType } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { Privilege } from '../privileges/privilege.entity';
import { UserType } from '../users/user-type.entity';
import { Device } from '../devices/device.entity';

@Entity('softwares')
export class Software extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column()
	@Expose()
	requiredMemory: string;

	@Column()
	@Expose()
	requiredStorage: string;

	@ManyToMany(() => Course, (course) => course.softwares, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'course_softwares' })
	courses: Promise<Course[]>;

	assignments: Promise<SoftwareCourseAssignment[]>;
	__assignments__?: SoftwareCourseAssignment[];
}
