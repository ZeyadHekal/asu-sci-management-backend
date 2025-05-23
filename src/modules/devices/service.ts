import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
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
import { DeviceListDto, DevicePaginationInput, MaintenanceUpdateDto } from './dtos';
import { PaginationInput } from 'src/base/pagination.input';
import { Software } from 'src/database/softwares/software.entity';
import { DeviceReport } from 'src/database/devices/devices_reports.entity';
import { DeviceLoginHistoryService } from '../device-login-history/service';
import { ReportStatus, DeviceReportPaginationInput } from '../device-reports/dtos';
import { DeviceReportService } from '../device-reports/service';
import { MaintenanceHistoryService } from '../device-maintenance-history/service';
import { MaintenanceHistoryPaginationInput } from '../device-maintenance-history/dtos';
import { LoginHistoryPaginationInput } from '../device-login-history/dtos';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { Privilege, UserPrivilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { MaintenanceType, MaintenanceStatus } from 'src/database/devices/device-maintenance-history.entity';

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
		@InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
		@InjectRepository(DeviceReport) private readonly deviceReportRepository: Repository<DeviceReport>,
		@InjectRepository(Privilege) private readonly privilegeRepository: Repository<Privilege>,
		@InjectRepository(UserPrivilege) private readonly userPrivilegeRepository: Repository<UserPrivilege>,
		@InjectRepository(UserTypePrivilege) private readonly userTypePrivilegeRepository: Repository<UserTypePrivilege>,
		private readonly deviceReportService: DeviceReportService,
		private readonly maintenanceHistoryService: MaintenanceHistoryService,
		private readonly deviceLoginHistoryService: DeviceLoginHistoryService,
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

		// Check if device name already exists in the same lab
		const existingDeviceWithName = await this.repository.findOne({
			where: { name: dto.name, labId: dto.labId },
		});
		if (existingDeviceWithName) {
			throw new BadRequestException(`Device with name '${dto.name}' already exists in this lab!`);
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

	async beforeUpdate(id: UUID, updateDto: imports.UpdateDto): Promise<imports.UpdateDto> {
		// Validate assistant has LAB_ASSISTANT privilege if being updated
		if (updateDto.assisstantId) {
			await this.validateUserHasLabAssistantPrivilege(updateDto.assisstantId);
		}

		// If name or labId is being updated, check for duplicates
		if (updateDto.name || updateDto.labId) {
			const currentDevice = await this.repository.findOneBy({ id });
			if (!currentDevice) {
				throw new NotFoundException('Device not found!');
			}

			const nameToCheck = updateDto.name || currentDevice.name;
			const labIdToCheck = updateDto.labId || currentDevice.labId;

			// Check if device name already exists in the target lab (excluding current device)
			const existingDeviceWithName = await this.repository.findOne({
				where: {
					name: nameToCheck,
					labId: labIdToCheck,
					id: Not(id),
				},
			});
			if (existingDeviceWithName) {
				throw new BadRequestException(`Device with name '${nameToCheck}' already exists in this lab!`);
			}
		}

		return updateDto;
	}

	async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
		const validatedDto = await this.beforeUpdate(id, updateDto);
		return super.update(id, validatedDto);
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
		const { page, limit, sortBy, sortOrder, deviceName, software, labId, status, assistantId, specCategory, specValue } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('device')
			.leftJoinAndSelect('device.user', 'assistant')
			.leftJoinAndSelect('device.lab', 'lab')
			.leftJoinAndSelect('device.specifications', 'specifications');

		// Apply filters
		if (deviceName) {
			query.andWhere('device.name LIKE :deviceName', { deviceName: `%${deviceName}%` });
		}

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

				// Get report counts for this device
				const totalReports = await this.deviceReportRepository.count({
					where: { deviceId: device.id }
				});

				const openReports = await this.deviceReportRepository.count({
					where: {
						deviceId: device.id,
						status: Not(ReportStatus.RESOLVED) // Count reports that are not resolved
					}
				});

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
					totalReports,
					openReports,
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
		// TODO: Remove this
		console.log(deviceSoftwares);
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

	async addSoftware(deviceId: UUID, addDto: imports.AddDeviceSoftwareDto): Promise<imports.GetDto> {
		// Check if device exists
		const device = await this.repository.findOne({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found!');
		}

		// Check if software exists
		const software = await this.softwareRepository.findOne({ where: { id: addDto.softwareId } });
		if (!software) {
			throw new NotFoundException('Software not found!');
		}

		// Check if software is already installed on device
		const existingDeviceSoftware = await this.deviceSoftwareRepository.findOne({
			where: { deviceId, softwareId: addDto.softwareId }
		});
		if (existingDeviceSoftware) {
			throw new BadRequestException('Software is already installed on this device!');
		}

		// Create device software entry
		const deviceSoftware = this.deviceSoftwareRepository.create({
			deviceId,
			softwareId: addDto.softwareId,
			hasIssue: addDto.hasIssue || false,
			issueDescription: addDto.issueDescription
		});

		await this.deviceSoftwareRepository.save(deviceSoftware);

		// Return the device information
		return this.getById(deviceId);
	}

	async updateSoftware(deviceId: UUID, softwareId: string, updateDto: imports.UpdateDeviceSoftwareDto): Promise<imports.GetDto> {
		// Check if device exists
		const device = await this.repository.findOne({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found!');
		}

		// Check if device software entry exists
		const deviceSoftware = await this.deviceSoftwareRepository.findOne({
			where: { deviceId, softwareId: softwareId as UUID }
		});
		if (!deviceSoftware) {
			throw new NotFoundException('Software is not installed on this device!');
		}

		// Update device software entry
		if (updateDto.hasIssue !== undefined) {
			deviceSoftware.hasIssue = updateDto.hasIssue;
		}
		if (updateDto.issueDescription !== undefined) {
			deviceSoftware.issueDescription = updateDto.issueDescription;
		}

		await this.deviceSoftwareRepository.save(deviceSoftware);

		// Return the device information
		return this.getById(deviceId);
	}

	async removeSoftware(deviceId: UUID, softwareId: string): Promise<imports.DeleteDto> {
		// Check if device exists
		const device = await this.repository.findOne({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found!');
		}

		// Check if device software entry exists
		const deviceSoftware = await this.deviceSoftwareRepository.findOne({
			where: { deviceId, softwareId: softwareId as UUID }
		});
		if (!deviceSoftware) {
			throw new NotFoundException('Software is not installed on this device!');
		}

		// Remove device software entry
		await this.deviceSoftwareRepository.remove(deviceSoftware);

		return { affected: 1 };
	}

	async updateSoftwareList(deviceId: UUID, updateDto: imports.UpdateDeviceSoftwareListDto): Promise<imports.GetDto> {
		// Check if device exists
		const device = await this.repository.findOne({ where: { id: deviceId } });
		if (!device) {
			throw new NotFoundException('Device not found!');
		}

		// Get all software to validate they exist
		const existingSoftware = await this.softwareRepository.findByIds(updateDto.softwareIds);
		if (existingSoftware.length !== updateDto.softwareIds.length) {
			throw new BadRequestException('One or more software IDs are invalid!');
		}

		// Get current device software
		const currentDeviceSoftware = await this.deviceSoftwareRepository.find({
			where: { deviceId }
		});

		// Remove all current software
		if (currentDeviceSoftware.length > 0) {
			await this.deviceSoftwareRepository.remove(currentDeviceSoftware);
		}

		// Add new software list
		const newDeviceSoftware = updateDto.softwareIds.map(softwareId =>
			this.deviceSoftwareRepository.create({
				deviceId,
				softwareId,
				hasIssue: false,
				issueDescription: null
			})
		);

		if (newDeviceSoftware.length > 0) {
			await this.deviceSoftwareRepository.save(newDeviceSoftware);
		}

		// Return the device information
		return this.getById(deviceId);
	}

	// Get device reports
	async getDeviceReports(id: UUID, input: PaginationInput): Promise<any> {
		// Check if device exists
		const device = await this.repository.findOneBy({ id });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		// Convert PaginationInput to DeviceReportPaginationInput and delegate to DeviceReportService
		const deviceReportInput: DeviceReportPaginationInput = {
			...input,
			deviceId: id
		};

		return this.deviceReportService.getDeviceReports(id, deviceReportInput);
	}

	// Get device maintenance history
	async getDeviceMaintenanceHistory(id: UUID, input: PaginationInput): Promise<any> {
		// Check if device exists
		const device = await this.repository.findOneBy({ id });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		// Convert PaginationInput to MaintenanceHistoryPaginationInput and delegate to MaintenanceHistoryService
		const maintenanceInput: MaintenanceHistoryPaginationInput = {
			...input,
			deviceId: id
		};

		return this.maintenanceHistoryService.getDeviceMaintenanceHistory(id, maintenanceInput);
	}

	// Get device login history
	async getDeviceLoginHistory(id: UUID, input: PaginationInput): Promise<any> {
		// Check if device exists
		const device = await this.repository.findOneBy({ id });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		// Convert PaginationInput to LoginHistoryPaginationInput and delegate to DeviceLoginHistoryService
		const loginInput: LoginHistoryPaginationInput = {
			...input
		};

		return this.deviceLoginHistoryService.findByDeviceId(id, loginInput);
	}

	async getDeviceDetails(id: UUID): Promise<imports.DeviceDetailsDto> {
		// Get device with all relationships
		const device = await this.repository
			.createQueryBuilder('device')
			.leftJoinAndSelect('device.lab', 'lab')
			.leftJoinAndSelect('device.user', 'assistant')
			.leftJoinAndSelect('device.specifications', 'specifications')
			.where('device.id = :id', { id })
			.getOne();

		if (!device) {
			throw new NotFoundException('Device not found');
		}

		// Get device software
		const deviceSoftware = await this.deviceSoftwareRepository
			.createQueryBuilder('deviceSoftware')
			.leftJoin('deviceSoftware.software', 'software')
			.addSelect(['software.id', 'software.name'])
			.where('deviceSoftware.deviceId = :deviceId', { deviceId: id })
			.getMany();

		// Get installed software details
		const installedSoftware = await Promise.all(
			deviceSoftware.map(async (ds) => {
				const software = await ds.software;
				return {
					id: software.id,
					name: software.name,
					hasIssue: ds.hasIssue || false,
					issueDescription: ds.issueDescription
				};
			})
		);

		// Get counts for reports, maintenance, and login sessions
		const totalReports = await this.deviceReportRepository.count({
			where: { deviceId: id }
		});
		const totalMaintenanceRecords = 0; // Placeholder for now
		const totalLoginSessions = 0; // Placeholder for now

		// Get lab and assistant details
		const lab = await device.lab;
		const assistant = await device.user;
		const specifications = await device.specifications;

		return transformToInstance(imports.DeviceDetailsDto, {
			id: device.id,
			name: device.name,
			IPAddress: device.IPAddress,
			hasIssue: device.hasIssue,
			status: device.hasIssue ? 'Has Issues' : 'Working',
			created_at: device.created_at,
			updated_at: device.updated_at,
			labId: device.labId,
			labName: lab?.name || 'Unknown Lab',
			labLocation: lab?.location || undefined,
			assisstantId: device.assisstantId,
			assistantName: assistant?.name || 'Unknown Assistant',
			assistantEmail: assistant?.email || undefined,
			specifications: specifications.map(spec => ({
				category: spec.category,
				value: spec.value
			})),
			installedSoftware,
			totalReports,
			totalMaintenanceRecords,
			totalLoginSessions,
			lastLoginDate: undefined,
			lastMaintenanceDate: undefined,
			lastReportDate: undefined
		});
	}

	async createMaintenanceUpdate(deviceId: UUID, dto: MaintenanceUpdateDto, userId: UUID): Promise<any> {
		// Check if device exists
		const device = await this.repository.findOneBy({ id: deviceId });
		if (!device) {
			throw new NotFoundException('Device not found');
		}

		// Update device status
		device.status = dto.status;
		await this.repository.save(device);

		// Create maintenance history record
		const maintenanceRecord = {
			deviceId,
			maintenanceType: MaintenanceType.OTHER,
			status: MaintenanceStatus.COMPLETED,
			description: dto.description || `Device status updated to ${dto.status}`,
			resolutionNotes: dto.resolutionNotes,
			involvedPersonnel: [userId],
			completedAt: new Date(),
		};

		// Delegate to maintenance history service
		await this.maintenanceHistoryService.create(maintenanceRecord);

		return this.getById(deviceId);
	}
}
