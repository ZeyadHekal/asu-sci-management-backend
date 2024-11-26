import { Entity, PrimaryGeneratedColumn, Column, TableInheritance, JoinColumn, ManyToOne, ManyToMany } from 'typeorm';
import { PrivilegeGroup } from './group.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { JSONSchemaType } from 'ajv';

@Entity('privileges')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Privilege extends ManagementEntity {
	@Column()
	name: string;

	@Column()
	code: string; // TODO: Enum identifier for privileges

	@Column({ type: 'json' })
	parameterStructure: JSONSchemaType<any>;

	@ManyToOne(() => PrivilegeGroup, (group) => group.privileges, { nullable: true })
	@JoinColumn({ name: 'group_id' })
	group?: PrivilegeGroup;

	@ManyToMany(() => User, (user) => user.privileges)
	users: User[];

	@ManyToMany(() => UserType, (userType) => userType.privileges)
	userTypes: UserType[];

	abstract validateParameters(params: any): boolean;
}
