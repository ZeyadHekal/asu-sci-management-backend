import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, PrimaryColumn, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { EntityName } from 'src/privileges/entity-map';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

@Entity('privileges')
export class Privilege extends ManagementEntity {
	@Column({ type: 'enum', enum: PrivilegeCode })
	@Expose()
	code: PrivilegeCode; // e.g., 'VIEW_COURSE', 'MANAGE_COURSE'

	@Column()
	@Expose()
	friendlyName: string; // e.g., 'VIEW_COURSE', 'MANAGE_COURSE'

	@Column()
	@Expose()
	group: string; // e.g., 'COURSES', 'REPORTS'

	@Column({ nullable: true })
	@Expose()
	paramKey: string; // e.g., 'courseId' - the route param to check

	@Column({ default: false })
	@Expose()
	requiresResource: boolean; // if true, the privilege is tied to a resource ID

	@Column({ nullable: true })
	@Expose()
	entityName: EntityName; // e.g., 'course', 'report'

	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;

	@Column({ nullable: false, unique: true })
	@Expose()
	key: string;

	@Column({ nullable: false })
	@Expose()
	description: string;

	@Column({ nullable: false })
	@Expose()
	category: string;

	@Column({ type: 'boolean', default: true })
	@Expose()
	isActive: boolean;
}

@Entity('user_privilege')
export class UserPrivilege extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn()
	user_id: UUID;

	@PrimaryColumn()
	privilege_id: UUID;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => User, (user) => user.userPrivileges, { lazy: true })
	@JoinColumn({ name: 'user_id' })
	user: Promise<User>;
	__user__?: User;

	@ManyToOne(() => Privilege, { lazy: true })
	@JoinColumn({ name: 'privilege_id' })
	privilege: Promise<Privilege>;
	__privilege__?: Privilege;

	@Column('simple-array', { nullable: true })
	resourceIds: UUID[];
}

@Entity('user_type_privilege')
export class UserTypePrivilege extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ type: 'string' })
	user_type_id: UUID;

	@PrimaryColumn({ type: 'string' })
	privilege_id: UUID;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => Privilege, { lazy: true })
	@JoinColumn({ name: 'privilege_id' })
	privilege: Promise<Privilege>;
	__privilege__?: Privilege;

	@ManyToOne(() => UserType, (ut) => ut.userTypePrivileges, { lazy: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_type_id' })
	userType: Promise<UserType>;
	__user_type__?: UserType;

	@Column('simple-array', { nullable: true })
	resourceIds: UUID[];
}
