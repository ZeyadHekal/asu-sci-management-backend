import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeWithPrivilegeDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { BaseService } from 'src/base/base.service';
import { UUID } from 'crypto';
import { transformToInstance } from 'src/base/transformToInstance';
import { PrivilegeAssignmentDto } from 'src/privileges/dtos';
import { Privilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { DeleteDto } from 'src/base/delete.dto';

@Injectable()
export class UserTypeService extends BaseService<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {
	constructor(
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(Privilege) private readonly privilegeRepository: Repository<Privilege>,
		@InjectRepository(UserTypePrivilege) private readonly userTypePrivAssignmentsRepo: Repository<UserTypePrivilege>,
	) {
		super(UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto, userTypeRepository);
	}

	async create(createUserDto: CreateUserTypeDto) {
		if (await this.userTypeRepository.findOneBy({ name: createUserDto.name })) {
			throw new BadRequestException('User type with this name already exists!');
		}
		const privilegeAssignments = [];
		for (const assignment of createUserDto.privilege_assignments) {
			const privilege = await this.privilegeRepository.findOneBy({ code: assignment.privilegeCode });
			if (!privilege) {
				throw new BadRequestException("Couldn't find privilege with code " + assignment.privilegeCode);
			}
			const assignmentEntity = new UserTypePrivilege();
			assignmentEntity.privilege_id = privilege.id;
			assignmentEntity.resourceIds = assignment.resourceIds;
			privilegeAssignments.push(assignmentEntity);
		}
		const entityToCreate = await this.mapDtoToEntity(createUserDto);
		const insertResult = await this.userTypeRepository.insert(entityToCreate);
		const id = insertResult.identifiers[0].id as UUID;
		for (let i = 0; i < privilegeAssignments.length; i++) {
			privilegeAssignments[i].user_type_id = id;
			await this.userTypePrivAssignmentsRepo.save(privilegeAssignments[i]);
		}
		const entity = await this.userTypeRepository.findOne({ where: { id } });
		entityToCreate.userTypePrivileges = Promise.resolve(privilegeAssignments);
		return this.mapEntityToGetDto(entity);
	}

	async findAllForStaffAssignment(): Promise<UserTypeDto[]> {
		const userTypes = await this.userTypeRepository.find({
			where: {
				name: Not('Student')
			}
		});
		return userTypes.map(userType => transformToInstance(UserTypeDto, userType));
	}

	async getPrivileges(id: UUID): Promise<PrivilegeAssignmentDto[]> {
		const userType = await this.userTypeRepository.findOne({ where: { id }, relations: ['assignments', 'assignments.privilege'] });
		if (!userType) {
			throw new NotFoundException();
		}
		return userType.__userTypePrivileges__.map((obj) =>
			transformToInstance(PrivilegeAssignmentDto, { ...obj.__privilege__, resourceIds: obj.resourceIds }),
		);
	}

	async findAllWithPrivileges({ search, page = 0, limit = 10 }: { search?: string; page?: number; limit?: number }) {
		const query = this.userTypeRepository
			.createQueryBuilder('userType')
			.leftJoinAndSelect('userType.userTypePrivileges', 'assignments')
			.leftJoinAndSelect('assignments.privilege', 'privilege');

		if (search) {
			query.andWhere('userType.name LIKE :search OR userType.description LIKE :search', { search: `%${search}%` });
		}

		query.skip(page * limit).take(limit);

		const [userTypes, total] = await query.getManyAndCount();
		const results = [] as UserTypeWithPrivilegeDto[];
		for (const userType of userTypes) {
			const result = transformToInstance(UserTypeWithPrivilegeDto, userType);
			result.privileges =
				userType.__userTypePrivileges__?.map((obj) =>
					transformToInstance(PrivilegeAssignmentDto, { ...obj.__privilege__, resourceIds: obj.resourceIds }),
				) || [];
			results.push(result);
		}
		return {
			items: results,
			total,
		};
	}

	async safeDelete(ids: UUID | UUID[]): Promise<DeleteDto> {
		// Split the IDs if passed as comma-separated string
		const idArray: UUID[] = typeof ids === 'string' ? (ids.split(',') as UUID[]) : Array.isArray(ids) ? ids : [ids];

		// Check for non-deletable user types
		const userTypesToDelete = await this.userTypeRepository.find({
			where: { id: In(idArray) },
		});

		const nonDeletableTypes = userTypesToDelete.filter((ut) => ut.isDeletable === false);
		if (nonDeletableTypes.length > 0) {
			throw new BadRequestException(`The following user types cannot be deleted: ${nonDeletableTypes.map((t) => t.name).join(', ')}`);
		}

		return super.delete(idArray);
	}
}
