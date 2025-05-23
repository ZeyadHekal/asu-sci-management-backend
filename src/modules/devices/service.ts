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
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { DeviceSpecification } from 'src/database/devices/device-specification.entity';
import { DeviceListDto, DevicePaginationInput } from './dtos';

@Injectable()
export class DeviceService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(DeviceSoftware) private readonly deviceSoftwareRepository: Repository<DeviceSoftware>,
		@InjectRepository(DeviceSpecification) private readonly deviceSpecificationRepository: Repository<DeviceSpecification>,
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
			throw new BadRequestException('Invalid assistant id!');
		}
		return dto;
	}

	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		const user = await this.userRepository.findOneBy({ id: dto.assisstantId });
		const assisstantType = await this.userTypeRepository.findOneBy({ name: 'Assisstant' });
		if (!user) {
			throw new BadRequestException('Invalid user id!');
		}
		if (!assisstantType) {
			throw new BadRequestException('Invalid assisstant id!');
		}
		return dto;
	}

	async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
		const device = await super.create(createDto);

		if (createDto.specifications) {
			const specifications = createDto.specifications.map((spec) => {
				const deviceSpec = new DeviceSpecification();
				deviceSpec.category = spec.category;
				deviceSpec.value = spec.value;
				deviceSpec.deviceId = device.id;
				return deviceSpec;
			});

			await this.deviceSpecificationRepository.save(specifications);
		}

		return device;
	}

	async getPaginated(input: DevicePaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder, software, labId, status, assistantId, specCategory, specValue } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('device')
			.leftJoinAndSelect('device.user', 'assistant')
			.leftJoinAndSelect('device.lab', 'lab')
			.leftJoinAndSelect('device.specifications', 'specifications');

		// Apply filters
		if (labId) {
			query.andWhere('device.labId = :labId', { labId });
		}

		if (assistantId) {
			query.andWhere('device.assisstantId = :assistantId', { assistantId });
		}

		if (status) {
			if (status.toLowerCase() === 'working') {
				query.andWhere('device.hasIssue = :hasIssue', { hasIssue: false });
			} else if (status.toLowerCase() === 'has issues') {
				query.andWhere('device.hasIssue = :hasIssue', { hasIssue: true });
			}
		}

		if (software) {
			query
				.leftJoin('device_softwares', 'deviceSoftwares', 'deviceSoftwares.device_id = device.id')
				.leftJoin('softwares', 'softwareEntity', 'softwareEntity.id = deviceSoftwares.software_id')
				.andWhere('softwareEntity.name LIKE :software', { software: `%${software}%` });
		}

		if (specCategory || specValue) {
			if (specCategory) {
				query.andWhere('specifications.category LIKE :specCategory', { specCategory: `%${specCategory}%` });
			}
			if (specValue) {
				query.andWhere('specifications.value LIKE :specValue', { specValue: `%${specValue}%` });
			}
		}

		query.skip(skip).take(limit);

		if (sortBy && sortOrder) {
			query.orderBy(`device.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
		}

		const [devices, total] = await query.getManyAndCount();

		const items = await Promise.all(
			devices.map(async (device) => {
				const assistant = await device.user;
				const lab = await device.lab;
				const specifications = await device.specifications;

				return transformToInstance(DeviceListDto, {
					...device,
					labAssistant: assistant ? assistant.name : 'N/A',
					labName: lab ? lab.name : 'N/A',
					addedSince: device.created_at,
					status: device.hasIssue ? 'Has Issues' : 'Working',
					specDetails: specifications.map((spec) => ({
						category: spec.category,
						value: spec.value,
					})),
				});
			}),
		);

		return { items, total };
	}

	async getSoftwares(id: UUID, pagination: DevicePaginationInput): Promise<DeviceSoftwarePagedDto> {
		const { page, limit } = pagination;
		const skip = page * limit;

		// Check if device exists
		const deviceExists = await this.repository.findOne({ where: { id } });
		if (!deviceExists) {
			throw new NotFoundException('Device not found!');
		}

		// Query for softwares with pagination
		const query1 = await this.deviceSoftwareRepository
			.createQueryBuilder('deviceSoftware')
			.where('deviceSoftware.deviceId = :id', { id })
			.leftJoin('deviceSoftware.software', 'software')
			.skip(skip)
			.take(limit);
		const total = await query1.getCount();
		const deviceSoftwares = await query1.getRawMany();

		// Transform to DTOs
		const items = deviceSoftwares.map((devSoft: any) =>
			transformToInstance(DeviceSoftwareListDto, {
				id: devSoft.software.id,
				name: devSoft.software.name,
				hasIssues: devSoft.hasIssues,
			}),
		);

		// Return paginated results
		return { total, items };
	}
}
