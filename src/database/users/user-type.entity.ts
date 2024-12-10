import { Entity, Column, OneToMany } from 'typeorm';
import { UserTypePrivilegeAssignment } from 'src/database/privileges/privilege.entity';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';

@Entity('user_types')
export class UserType extends ManagementEntity {
	@Column()
	@Expose()
	name: string;

	@OneToMany(() => UserTypePrivilegeAssignment, (assignment) => assignment.userType, {
		lazy: true,
	})
	assignments: Promise<UserTypePrivilegeAssignment[]>;
}
