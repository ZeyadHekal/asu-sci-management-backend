import { Entity, Column, OneToMany } from 'typeorm';
import { UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';

@Entity('user_types')
export class UserType extends ManagementEntity {
	@Column()
	@Expose()
	name: string;

	@Column({ nullable: true })
	@Expose()
	description: string;

	@Column({ default: true })
	@Expose()
	isDeletable: boolean;

	@OneToMany(() => UserTypePrivilege, (userTypePrivilege) => userTypePrivilege.userType, {
		lazy: true,
	})
	userTypePrivileges: Promise<UserTypePrivilege[]>;
	__userTypePrivileges__?: UserTypePrivilege[];
}
