import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeWithPrivilegeDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { BaseService } from 'src/base/base.service';
import { UUID } from 'crypto';
import { transformToInstance } from 'src/base/transformToInstance';
import { PrivilegeAssignmentDto } from 'src/privileges/dtos';
import { Privilege, UserTypePrivilegeAssignment } from 'src/database/privileges/privilege.entity';

@Injectable()
export class UserTypeService extends BaseService<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {

	constructor(@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(Privilege) private readonly privilegeRepository: Repository<Privilege>,
		@InjectRepository(UserTypePrivilegeAssignment) private readonly userTypePrivAssignmentsRepo: Repository<UserTypePrivilegeAssignment>
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
			const assignmentEntity = new UserTypePrivilegeAssignment();
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
		entityToCreate.assignments = Promise.resolve(privilegeAssignments);
		return this.mapEntityToGetDto(entity);
	}

	async getPrivileges(id: UUID): Promise<PrivilegeAssignmentDto[]> {
		const userType = await this.userTypeRepository.findOne({ where: { id }, relations: ['assignments', 'assignments.privilege'] });
		if (!userType) {
			throw new NotFoundException();
		}
		return userType.__assignments__.map(obj => transformToInstance(PrivilegeAssignmentDto, { ...obj.__privilege__, resourceIds: obj.resourceIds }));
	}

	async findAllWithPrivileges() {
		const userTypes = await this.userTypeRepository.find({ relations: ['assignments', 'assignments.privilege'] });
		const results = [] as UserTypeWithPrivilegeDto[];
		for (const userType of userTypes) {
			const result = transformToInstance(UserTypeWithPrivilegeDto, userType);
			result.privileges = userType.__assignments__.map(obj => transformToInstance(PrivilegeAssignmentDto, { ...obj.__privilege__, resourceIds: obj.resourceIds }));
			results.push(result);
		}
		return results;
	}
}
