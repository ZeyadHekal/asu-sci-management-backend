import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, OneToMany } from 'typeorm';
import { Privilege, UserPrivilegeAssignment } from 'src/database/privileges/privilege.entity';
import { UserType } from './user-type.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { EventSchedule } from '../events/event_schedules.entity';
import { EntityName } from 'src/privileges/entity-map';

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

	@OneToMany(() => UserPrivilegeAssignment, (assignment) => assignment.user, {
		cascade: true,
		lazy: true,
	})
	assignments: Promise<UserPrivilegeAssignment[]>;

	@ManyToMany(() => Course, (course) => course.users, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'doctors_courses' })
	courses: Promise<Course[]>;

	@ManyToMany(() => EventSchedule, (eventSchedule) => eventSchedule.assisstant, { lazy: true, cascade: true })
	event_schedules: Promise<EventSchedule[]>;

	async getUserPrivileges(): Promise<Record<string, { resourceIds: UUID[] | null; paramKey: string | null; requiresResource: boolean; entityName: EntityName | null }>> {
		// Build a map keyed by privilege name
		const privilegeMap: Record<string, { resourceIds: UUID[] | null; paramKey: string | null; requiresResource: boolean; entityName: EntityName | null }> =
			{};
		const userType = await this.userType;
		const userTypePrivileges = await userType.assignments;
		// Combine userType privileges
		for (const utp of userTypePrivileges) {
			const privilege = await utp.privilege;
			privilegeMap[privilege.code] = {
				resourceIds: utp.resourceIds || null,
				paramKey: privilege.paramKey,
				requiresResource: privilege.requiresResource,
				entityName: privilege.entityName,
			};
		}

		// Combine user-specific privileges (override or add resources)
		for (const up of await this.assignments) {
			const privilege = await up.privilege;
			if (!privilegeMap[privilege.code]) {
				privilegeMap[privilege.code] = {
					resourceIds: up.resourceIds || null,
					paramKey: privilege.paramKey,
					requiresResource: privilege.requiresResource,
					entityName: privilege.entityName,
				};
			} else {
				const existing = privilegeMap[privilege.code];
				// If existing is null (all resources), no need to merge
				if (existing.resourceIds !== null && up.resourceIds !== null) {
					existing.resourceIds = Array.from(new Set([...(existing.resourceIds || []), ...up.resourceIds]));
				} else {
					// If either is null, result is null (all access)
					existing.resourceIds = null;
				}
			}
		}
		return privilegeMap;
	}
}
