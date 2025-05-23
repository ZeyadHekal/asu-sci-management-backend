import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { LabListDto } from './dtos';
import { UUID } from 'crypto';

@Injectable()
export class LabService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const supervisor = await this.userRepository.findOneBy({ id: dto.supervisorId });
		if (!supervisor) {
			throw new BadRequestException('Invalid supervisor id!');
		}
		return dto;
	}

	async beforeUpdateDto(dto: imports.UpdateDto): Promise<imports.UpdateDto> {
		if (dto.supervisorId) {
			const supervisor = await this.userRepository.findOneBy({ id: dto.supervisorId });
			if (!supervisor) {
				throw new BadRequestException('Invalid supervisor id!');
			}
		}
		return dto;
	}

	private async getLabStatus(labId: UUID): Promise<string> {
		const devices = await this.deviceRepository.find({ where: { labId } });
		if (devices.length === 0) return 'Available';

		const hasIssues = devices.some((device) => device.hasIssue);
		if (hasIssues) return 'Under Maintenance';

		return 'In Use';
	}

	private async getDeviceCount(labId: UUID): Promise<number> {
		return this.deviceRepository.count({ where: { labId } });
	}

	async getPaginated(input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const [labs, total] = await this.repository.findAndCount({
			relations: ['supervisor'],
			skip,
			take: limit,
			order: { [sortBy]: sortOrder },
		});

		const items = await Promise.all(
			labs.map(async (lab) => {
				const deviceCount = await this.getDeviceCount(lab.id);
				const status = await this.getLabStatus(lab.id);
				return transformToInstance(LabListDto, {
					...lab,
					deviceCount,
					status,
				});
			}),
		);

		return { items, total };
	}

	async getById(id: UUID): Promise<imports.GetDto> {
		const lab = await this.repository.findOne({
			where: { id },
			relations: ['supervisor'],
		});

		if (!lab) {
			throw new NotFoundException('Lab not found!');
		}

		const deviceCount = await this.getDeviceCount(id);
		const status = await this.getLabStatus(id);

		return transformToInstance(imports.GetDto, {
			...lab,
			deviceCount,
			status,
		});
	}
}
