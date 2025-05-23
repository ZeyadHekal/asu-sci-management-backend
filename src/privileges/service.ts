// privileges.service.ts
import { DataSource, In, Repository } from 'typeorm';
import { EntityName, entityNameToEntityClass } from './entity-map';
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { Privilege, UserPrivilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { PrivilegeCode } from '../db-seeder/data/privileges';
import { InjectRepository } from '@nestjs/typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { DeleteDto } from 'src/base/delete.dto';
import { transformToInstance } from 'src/base/transformToInstance';
import { UserDto } from 'src/users/dtos';
import { WebsocketService } from 'src/websockets/websocket.service';

@Injectable()
export class PrivilegeService {
	constructor(
		private dataSource: DataSource,
		@InjectRepository(UserPrivilege) private readonly userPrivAssignmentsRepo: Repository<UserPrivilege>,
		@InjectRepository(UserTypePrivilege) private readonly userTypePrivAssignmentsRepo: Repository<UserTypePrivilege>,
		@InjectRepository(UserType) private readonly userTypeRepo: Repository<UserType>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Privilege) private readonly privilegesRepo: Repository<Privilege>,
		private readonly websocketService: WebsocketService,
	) {}

	async getAllPrivileges(): Promise<Privilege[]> {
		return this.privilegesRepo.find();
	}

	async assignPrivilegeToUser(userId: UUID, privilegeCode: PrivilegeCode, resourceIds?: UUID[]): Promise<void> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!user || !privilege) {
			throw new BadRequestException('User or privilege not found');
		}

		const assignment = new UserPrivilege();
		assignment.user_id = user.id;
		assignment.privilege_id = privilege.id;
		assignment.resourceIds = resourceIds || null;
		await this.userPrivAssignmentsRepo.save(assignment);

		// Notify the user via WebSocket
		this.websocketService.notifyPrivilegeChange(userId, privilegeCode, true, resourceIds);
	}

	async assignPrivilegeToUserType(userTypeId: UUID, privilegeCode: PrivilegeCode, resourceIds?: UUID[]): Promise<void> {
		const userType = await this.userTypeRepo.findOne({ where: { id: userTypeId } });
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!userType || !privilege) {
			throw new BadRequestException('User type or privilege not found');
		}

		const assignment = new UserTypePrivilege();
		assignment.user_type_id = userType.id;
		assignment.privilege_id = privilege.id;
		assignment.resourceIds = resourceIds || null;
		await this.userTypePrivAssignmentsRepo.save(assignment);

		// Notify all users of this type via WebSocket
		this.websocketService.notifyUserTypePrivilegeChange(userTypeId, privilegeCode, true, resourceIds);
	}

	async unassignPrivilegeFromUser(userId: UUID, privilegeCode: PrivilegeCode): Promise<DeleteDto> {
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!privilege) {
			throw new BadRequestException('Privilege not found');
		}
		const userAssignment = await this.userPrivAssignmentsRepo.findOne({ where: { user_id: userId, privilege_id: privilege.id } });
		if (!userAssignment) {
			throw new BadRequestException('User privilege assignment not found');
		}

		const result = transformToInstance(DeleteDto, await this.userPrivAssignmentsRepo.delete({ user_id: userId, privilege_id: privilege.id }));

		// Notify the user about privilege removal via WebSocket
		this.websocketService.notifyPrivilegeChange(userId, privilegeCode, false);

		return result;
	}

	async unassignPrivilegeFromUserType(userTypeId: UUID, privilegeCode: PrivilegeCode): Promise<DeleteDto> {
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!privilege) {
			throw new BadRequestException('User type or privilege not found');
		}

		// Check if we're trying to remove MANAGE_SYSTEM from Admin user type
		if (privilegeCode === PrivilegeCode.MANAGE_SYSTEM) {
			const userType = await this.userTypeRepo.findOne({ where: { id: userTypeId } });
			if (userType && userType.name === 'Admin') {
				throw new ForbiddenException('Cannot remove MANAGE_SYSTEM privilege from Admin user type');
			}
		}

		const userTypeAssignment = await this.userTypePrivAssignmentsRepo.findOne({ where: { user_type_id: userTypeId, privilege_id: privilege.id } });
		if (!userTypeAssignment) {
			throw new BadRequestException('User type or privilege not found');
		}

		const result = transformToInstance(DeleteDto, await this.userTypePrivAssignmentsRepo.delete({ user_type_id: userTypeId, privilege_id: privilege.id }));

		// Notify all users of this type about privilege removal
		this.websocketService.notifyUserTypePrivilegeChange(userTypeId, privilegeCode, false);

		return result;
	}

	async getUsersByPrivilege(privilegeCode: PrivilegeCode): Promise<UserDto[]> {
		// Find the privilege
		const privilege = await this.privilegesRepo.findOne({ where: { code: privilegeCode } });
		if (!privilege) {
			throw new BadRequestException(`Privilege with code ${privilegeCode} not found`);
		}

		// Find users who have this privilege directly assigned
		const userPrivileges = await this.userPrivAssignmentsRepo.find({
			where: { privilege_id: privilege.id },
			relations: ['user'],
		});
		const usersWithDirectPrivilege = await Promise.all(userPrivileges.map(async (up) => await up.user));

		// Find user types that have this privilege
		const userTypePrivileges = await this.userTypePrivAssignmentsRepo.find({
			where: { privilege_id: privilege.id },
		});
		const userTypeIds = userTypePrivileges.map((utp) => utp.user_type_id);

		// Find users with those user types
		const usersWithTypePrivilege = await this.userRepo.find({
			where: { userTypeId: In(userTypeIds) },
		});

		// Combine and deduplicate users
		const allUsers = [...usersWithDirectPrivilege, ...usersWithTypePrivilege];
		const uniqueUserMap = new Map<string, User>();

		allUsers.forEach((user) => {
			uniqueUserMap.set(user.id.toString(), user);
		});

		// Convert User entities to UserDto objects
		return Array.from(uniqueUserMap.values()).map((user) => transformToInstance(UserDto, user));
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
