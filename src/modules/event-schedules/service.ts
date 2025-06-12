import { BadRequestException, Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { Privilege, UserPrivilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { UUID } from 'crypto';

@Injectable()
export class EventScheduleService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(Privilege) private readonly privilegeRepository: Repository<Privilege>,
		@InjectRepository(UserPrivilege) private readonly userPrivilegeRepository: Repository<UserPrivilege>,
		@InjectRepository(UserTypePrivilege) private readonly userTypePrivilegeRepository: Repository<UserTypePrivilege>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}

		// Validate assistant has LAB_ASSISTANT privilege
		if (dto.assisstantId) {
			await this.validateUserHasLabAssistantPrivilege(dto.assisstantId);
		}

		return dto;
	}

	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}

		// Validate assistant has LAB_ASSISTANT privilege
		if (dto.assisstantId) {
			await this.validateUserHasLabAssistantPrivilege(dto.assisstantId);
		}

		return dto;
	}

	async beforeUpdate(id: UUID, updateDto: imports.UpdateDto): Promise<imports.UpdateDto> {
		// Validate assistant has LAB_ASSISTANT privilege if being updated
		if (updateDto.assisstantId) {
			await this.validateUserHasLabAssistantPrivilege(updateDto.assisstantId);
		}

		return updateDto;
	}

	async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
		const validatedDto = await this.beforeUpdate(id, updateDto);
		return super.update(id, validatedDto);
	}

	/**
	 * Validates that a user has the LAB_ASSISTANT privilege
	 * @param userId The user ID to validate
	 */
	private async validateUserHasLabAssistantPrivilege(userId: UUID): Promise<void> {
		const user = await this.userRepository.findOneBy({ id: userId });
		if (!user) {
			throw new BadRequestException('Invalid assistant id!');
		}

		// Find the LAB_ASSISTANT privilege
		const labAssistantPrivilege = await this.privilegeRepository.findOneBy({ code: PrivilegeCode.LAB_ASSISTANT });
		if (!labAssistantPrivilege) {
			throw new BadRequestException('LAB_ASSISTANT privilege not found in system!');
		}

		// Check if user has direct LAB_ASSISTANT privilege
		const directPrivilege = await this.userPrivilegeRepository.findOne({
			where: {
				user_id: userId,
				privilege_id: labAssistantPrivilege.id
			}
		});

		if (directPrivilege) {
			return; // User has direct privilege
		}

		// Check if user's user type has LAB_ASSISTANT privilege
		const userTypePrivilege = await this.userTypePrivilegeRepository.findOne({
			where: {
				user_type_id: user.userTypeId,
				privilege_id: labAssistantPrivilege.id
			}
		});

		if (!userTypePrivilege) {
			throw new BadRequestException('User does not have LAB_ASSISTANT privilege!');
		}
	}
}
