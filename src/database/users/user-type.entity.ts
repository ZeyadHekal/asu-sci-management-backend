import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { Privilege } from 'src/database/privileges/privilege.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';

@Entity('user_types')
export class UserType extends ManagementEntity {
	@Column()
	@Expose()
	name: string;

	@ManyToMany(() => Privilege, (privilege) => privilege.userTypes, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'user_types_privileges' })
	privileges: Promise<Privilege[]>;
}
