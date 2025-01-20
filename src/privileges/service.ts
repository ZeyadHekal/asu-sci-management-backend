// privileges.service.ts
import { DataSource, In, Repository } from 'typeorm';
import { EntityName, entityNameToEntityClass } from './entity-map';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { Privilege, UserPrivilegeAssignment, UserTypePrivilegeAssignment } from 'src/database/privileges/privilege.entity';
import { PrivilegeCode } from './definition';
import { InjectRepository } from '@nestjs/typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { DeleteDto } from 'src/base/delete.dto';
import { transformToInstance } from 'src/base/transformToInstance';

@Injectable()
export class PrivilegeService {
	constructor(
		private dataSource: DataSource,
		@InjectRepository(UserPrivilegeAssignment) private readonly userPrivAssignmentsRepo: Repository<UserPrivilegeAssignment>,
		@InjectRepository(UserTypePrivilegeAssignment) private readonly userTypePrivAssignmentsRepo: Repository<UserTypePrivilegeAssignment>,
		@InjectRepository(UserType) private readonly userTypeRepo: Repository<UserType>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Privilege) private readonly privilegesRepo: Repository<Privilege>,
	) { }

	async getAllPrivileges(): Promise<Privilege[]> {
		return this.privilegesRepo.find();
	}

	async assignPrivilegeToUser(userId: UUID, privilegeCode: PrivilegeCode, resourceIds?: UUID[]): Promise<void> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!user || !privilege) {
			throw new BadRequestException('User or privilege not found');
		}

		const assignment = new UserPrivilegeAssignment();
		assignment.user_id = user.id;
		assignment.privilege_id = privilege.id;
		assignment.resourceIds = resourceIds || null;
		await this.userPrivAssignmentsRepo.save(assignment);
	}

	async assignPrivilegeToUserType(userTypeId: UUID, privilegeCode: PrivilegeCode, resourceIds?: UUID[]): Promise<void> {
		const userType = await this.userTypeRepo.findOne({ where: { id: userTypeId } });
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!userType || !privilege) {
			throw new BadRequestException('User type or privilege not found');
		}

		const assignment = new UserTypePrivilegeAssignment();
		assignment.user_type_id = userType.id;
		assignment.privilege_id = privilege.id;
		assignment.resourceIds = resourceIds || null;
		await this.userTypePrivAssignmentsRepo.save(assignment);
	}

	async unassignPrivilegeToUserType(userTypeId: UUID, privilegeCode: PrivilegeCode): Promise<DeleteDto> {
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!privilege) {
			throw new BadRequestException('User type or privilege not found');
		}
		const userTypeAssignment = await this.userTypePrivAssignmentsRepo.findOne({ where: { user_type_id: userTypeId, privilege_id: privilege.id } });
		if (!userTypeAssignment) {
			throw new BadRequestException('User type or privilege not found');
		}
		return transformToInstance(DeleteDto, this.userTypePrivAssignmentsRepo.delete({ user_type_id: userTypeId, privilege_id: privilege.id }));
	}

	private async validateResourceIds(entityName: string | null, resourceIds?: number[]) {
		if (!entityName || !resourceIds || resourceIds.length === 0) return;

		const entityClass = entityNameToEntityClass[entityName];
		if (!entityClass) {
			throw new BadRequestException(`No entity class mapping found for entityName: ${entityName}`);
		}

		const repo = this.dataSource.getRepository(entityClass);
		const found = await repo.findBy({ id: In(resourceIds) });
		if (found.length !== resourceIds.length) {
			const foundIds = new Set(found.map((r) => r.id));
			const missing = resourceIds.filter((id) => !foundIds.has(id));
			throw new NotFoundException(`Some ${entityName}(s) not found: ${missing.join(', ')}`);
		}
	}
}
