import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { EntityName } from 'src/privileges/entity-map';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';

@Entity('privileges')
export class Privilege extends ManagementEntity {
	@Column({ type: 'enum', enum: PrivilegeCode })
	code: PrivilegeCode; // e.g., 'VIEW_COURSE', 'MANAGE_COURSE'

	@Column()
	friendlyName: string; // e.g., 'VIEW_COURSE', 'MANAGE_COURSE'

	@Column()
	group: string; // e.g., 'COURSES', 'REPORTS'

	@Column({ nullable: true })
	paramKey: string; // e.g., 'courseId' - the route param to check

	@Column({ default: false })
	requiresResource: boolean; // if true, the privilege is tied to a resource ID

	@Column({ nullable: true })
	entityName: EntityName; // e.g., 'course', 'report'
}

@Entity('user_privilege')
export class UserPrivilege extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn()
	user_id: UUID;

	@PrimaryColumn()
	privilege_id: UUID;

	@ManyToOne(() => User, (user) => user.userPrivileges, { lazy: true })
	@JoinColumn({ name: 'user_id' })
	user: Promise<User>;

	@ManyToOne(() => Privilege, { lazy: true })
	@JoinColumn({ name: 'privilege_id' })
	privilege: Promise<Privilege>;

	@Column('simple-array', { nullable: true })
	resourceIds: UUID[];
}

@Entity('user_type_privilege')
export class UserTypePrivilege extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ type: 'string' })
	user_type_id: UUID;

	@PrimaryColumn({ type: 'string' })
	privilege_id: UUID;

	@Column('simple-array', { nullable: true })
	resourceIds: UUID[];

	@ManyToOne(() => Privilege, { lazy: true })
	@JoinColumn({ name: 'privilege_id' })
	privilege: Promise<Privilege>;
	__privilege__?: Privilege;

	@ManyToOne(() => UserType, (ut) => ut.userTypePrivileges, { lazy: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_type_id' })
	userType: Promise<UserType>;
	__userType__?: UserType;
}
