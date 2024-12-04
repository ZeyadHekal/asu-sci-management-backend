import { Entity, Column, ManyToMany, PrimaryColumn } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { JSONSchemaType } from 'ajv';
import { OmitType } from '@nestjs/swagger';

@Entity('privileges')
export class Privilege extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn('uuid')
	code: string;

	@Column()
	name: string;

	@Column()
	group: string;

	@Column({ nullable: true, type: 'json' })
	parameterStructure: {
		// This will be used for parameterized privileges
		type: 'entity' | 'custom';
		entityName?: string;
		fieldLocation: 'body' | 'query' | 'path';
		fieldName: string;
		data: string[]; // Entity IDs or custom data values
	}[];

	@ManyToMany(() => User, (user) => user.privileges)
	users: User[];

	@ManyToMany(() => UserType, (userType) => userType.privileges)
	userTypes: UserType[];
}
