import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Privilege } from 'src/database/privileges/privilege.entity';
import { UserType } from './user-type.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { EventSchedule } from '../events/event_schedules.entity';

@Entity('users')
export class User extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	username: string;

	@Column()
	@Expose()
	name: string;

	@Column({ nullable: false })
	@Expose()
	password: string;

	@Column({ nullable: false, name: 'user_type_id' })
	@Expose()
	userTypeId: UUID;

	@ManyToOne(() => UserType, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'user_type_id' })
	userType: Promise<UserType>;

	@ManyToMany(() => Privilege, (privilege) => privilege.users, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'users_privileges' })
	privileges: Promise<Privilege[]>;

	@ManyToMany(() => Course, (course) => course.users, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'doctors_courses' })
	courses: Promise<Course[]>;

	@ManyToMany(() => EventSchedule, (eventSchedule) => eventSchedule.assisstant, { lazy: true, cascade: true })
	event_schedules: Promise<EventSchedule[]>;

	async getEffectivePrivileges(): Promise<Privilege[]> {
		const typePrivileges = (await (await this.userType)?.privileges) || [];
		return [...typePrivileges, ...(await this.privileges)];
	}
}
