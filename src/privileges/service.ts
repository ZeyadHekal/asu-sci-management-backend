import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ParameterizedPrivilege } from '../database/privileges/parameterized.entity';
import { Privilege } from '../database/privileges/privilege.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';

@Injectable()
export class PrivilegeService {
	constructor(
		@InjectRepository(Privilege)
		private privilegeRepository: Repository<Privilege>,
		// private parameterValidatorService: ParameterValidatorService,
	) {}

	async getAllPrivilegesGrouped(): Promise<{ [groupName: string]: Privilege[] }> {
		const privileges = await this.privilegeRepository.find({
			relations: ['group'], // Fetch the related group
		});

		return privileges.reduce(
			(acc, privilege) => {
				const groupName = privilege.group?.name || 'Ungrouped';
				if (!acc[groupName]) acc[groupName] = [];
				acc[groupName].push(privilege);
				return acc;
			},
			{} as { [groupName: string]: Privilege[] },
		);
	}

	async assignPrivilegeToUser(user: User, privilegeId: UUID, params?: any) {
		const privilege = await this.privilegeRepository.findOneBy({ id: privilegeId });
		if (!privilege) throw new Error('Privilege not found');

		if (privilege instanceof ParameterizedPrivilege) {
			// const isValid = await this.parameterValidatorService.validateParameters(privilege, params);
			// if (!isValid) throw new Error('Invalid parameters');
		}

		(await user.privileges).push(privilege);
		// Save user using User repository
	}

	async assignPrivilegeToUserType(userType: UserType, privilegeId: UUID) {
		const privilege = await this.privilegeRepository.findOneBy({ id: privilegeId });
		if (!privilege) throw new Error('Privilege not found');
		const privileges = await userType.privileges;
		privileges.push(privilege);
		await userType.save();
		// Save userType using UserType repository
	}

	async getPrivilegesForUser(user: User): Promise<Privilege[]> {
		const typePrivileges = (await (await user.userType)?.privileges) || [];
		return [...typePrivileges, ...(await user.privileges)];
	}
}
