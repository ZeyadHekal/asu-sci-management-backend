import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Privilege } from './privilege.entity';
import { ManagementEntity } from 'src/base/base.entity';

@Entity('privilege_groups')
export class PrivilegeGroup extends ManagementEntity {
	@Column()
	name: string; // Group name

	@Column({ nullable: true })
	description?: string; // Optional description

	@OneToMany(() => Privilege, (privilege) => privilege.group)
	privileges: Privilege[];
}
