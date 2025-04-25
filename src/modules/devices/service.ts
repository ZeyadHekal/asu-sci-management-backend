import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Lab } from 'src/database/labs/lab.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { UUID } from './imports';
import { transformToInstance } from 'src/base/transformToInstance';
import { DeviceSoftwareListDto, DeviceSoftwarePagedDto } from '../softwares/dtos';

@Injectable()
export class DeviceService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		const user = await this.userRepository.findOneBy({ id: dto.assisstantId });
		if (!user) {
			throw new BadRequestException('Invalid lab id!');
		}
		return dto;
	}
	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		const user = await this.userRepository.findOneBy({ id: dto.assisstantId });
		const assisstantType = await this.userTypeRepository.findOneBy({ name: "Assisstant" });
		if (!user) {
			throw new BadRequestException('Invalid user id!');
		}
		if (!assisstantType) {
			throw new BadRequestException('Invalid assisstant id!');
		}
		return dto;
	}

	async getSoftwares(id: UUID, pagination: imports.PaginationInput): Promise<DeviceSoftwarePagedDto> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		// Check if device exists
		const deviceExists = await this.repository.findOne({ where: { id } });
		if (!deviceExists) {
			throw new NotFoundException();
		}

		// Query for softwares with pagination
		// TODO: Change repository with 
		const query1 = await this.repository
			.createQueryBuilder('deviceSoftware')
			.leftJoin('deviceSoftware.software', 'software')
			.where('deviceSoftware.deviceId = :deviceId', { deviceId: id })
			.skip(skip)
			.take(limit)
		const total = await query1.getCount();
		const deviceSoftwares = await query1.getRawMany();

		// Transform to DTOs
		const items = deviceSoftwares.map((devSoft: any) =>
			transformToInstance(DeviceSoftwareListDto, {
				id: devSoft.software.id,
				name: devSoft.software.id,
				hasIssues: devSoft.hasIssues
			})
		);

		// Return paginated results
		return { total, items };
	}
}
