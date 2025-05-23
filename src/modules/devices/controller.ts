import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import {
	Entity,
	CreateDto,
	UpdateDto,
	GetDto,
	GetListDto,
	DeleteDto,
	PaginationInput,
	IPaginationOutput,
	PagedDto,
	BaseController,
	Service,
	constants,
	UUID,
	ApiResponse,
	ApiOperation,
	ApiTags,
	ApiParam,
	RequirePrivileges,
	PrivilegeCode,
	DeviceDetailsDto,
} from './imports';
import { DeviceSoftwarePagedDto } from '../softwares/dtos';
import { DevicePaginationInput, UpdateDeviceSoftwareDto, AddDeviceSoftwareDto, UpdateDeviceSoftwareListDto, MaintenanceUpdateDto } from './dtos';
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';

@ApiTags('devices')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_LABS] })
@Controller(constants.plural_name)
export class DeviceController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create device', description: 'Create a new device' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Device created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	// Lab Assistant endpoint - Get my assigned devices
	@Get('my-assigned')
	@RequirePrivileges({ and: [PrivilegeCode.LAB_ASSISTANT] })
	@ApiOperation({ summary: 'Get my assigned devices', description: 'Get devices assigned to current lab assistant' })
	@ApiResponse({ status: 200, description: 'My assigned devices retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async getMyAssignedDevices(@Query() input: DevicePaginationInput, @CurrentUser() user: User): Promise<IPaginationOutput<GetListDto>> {
		const modifiedInput = { ...input, assistantId: user.id };
		return this.service.getPaginated(modifiedInput) as Promise<IPaginationOutput<GetListDto>>;
	}

	@Get()
	@ApiOperation({ summary: 'Get all devices', description: 'Retrieve all devices' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Devices retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated devices', description: 'Retrieve devices with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated devices retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: DevicePaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get device by ID', description: 'Retrieve a device by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Device retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Get(':' + constants.entity_id + '/details')
	@ApiOperation({ summary: 'Get comprehensive device details', description: 'Retrieve comprehensive device information including lab, assistant, specifications, software, and statistics' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: DeviceDetailsDto, status: 200, description: 'Device details retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	getDeviceDetails(@Param(constants.entity_id) id: UUID): Promise<DeviceDetailsDto> {
		return this.service.getDeviceDetails(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update device', description: 'Update an existing device by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Device updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete devices', description: 'Delete one or multiple devices by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated device IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Devices deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more devices do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}

	// List all softwares for that device
	@Get(`:${constants.entity_id}/softwares`)
	@ApiOperation({ summary: 'Get device softwares', description: 'Retrieve all software installed on a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: DeviceSoftwarePagedDto, isArray: true, status: 200, description: 'Device softwares retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	async getSoftwares(@Param(constants.entity_id) id: UUID, @Query() input: DevicePaginationInput): Promise<DeviceSoftwarePagedDto> {
		return this.service.getSoftwares(id, input);
	}

	// Get device reports
	@Get(`:${constants.entity_id}/reports`)
	@ApiOperation({ summary: 'Get device reports', description: 'Retrieve all reports for a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ status: 200, description: 'Device reports retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	async getDeviceReports(@Param(constants.entity_id) id: UUID, @Query() input: PaginationInput): Promise<any> {
		return this.service.getDeviceReports(id, input);
	}

	// Get device maintenance history
	@Get(`:${constants.entity_id}/maintenance-history`)
	@ApiOperation({ summary: 'Get device maintenance history', description: 'Retrieve maintenance history for a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ status: 200, description: 'Device maintenance history retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	async getDeviceMaintenanceHistory(@Param(constants.entity_id) id: UUID, @Query() input: PaginationInput): Promise<any> {
		return this.service.getDeviceMaintenanceHistory(id, input);
	}

	// Get device login history
	@Get(`:${constants.entity_id}/login-history`)
	@ApiOperation({ summary: 'Get device login history', description: 'Retrieve login history for a specific device based on IP address' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ status: 200, description: 'Device login history retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	async getDeviceLoginHistory(@Param(constants.entity_id) id: UUID, @Query() input: PaginationInput): Promise<any> {
		return this.service.getDeviceLoginHistory(id, input);
	}

	@Post(`:${constants.entity_id}/softwares`)
	@ApiOperation({ summary: 'Add software to device', description: 'Add a new software to a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Software added successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	addSoftware(@Param(constants.entity_id) id: UUID, @Body() addDto: AddDeviceSoftwareDto): Promise<GetDto> {
		return this.service.addSoftware(id, addDto);
	}

	@Patch(`:${constants.entity_id}/softwares/:softwareId`)
	@ApiOperation({ summary: 'Update software on device', description: 'Update an existing software on a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiParam({ name: 'softwareId', description: 'Software ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Software updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device or software does not exist' })
	updateSoftware(@Param(constants.entity_id) id: UUID, @Param('softwareId') softwareId: string, @Body() updateDto: UpdateDeviceSoftwareDto): Promise<GetDto> {
		return this.service.updateSoftware(id, softwareId, updateDto);
	}

	@Delete(`:${constants.entity_id}/softwares/:softwareId`)
	@ApiOperation({ summary: 'Remove software from device', description: 'Remove an existing software from a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiParam({ name: 'softwareId', description: 'Software ID', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Software removed successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device or software does not exist' })
	removeSoftware(@Param(constants.entity_id) id: UUID, @Param('softwareId') softwareId: string): Promise<DeleteDto> {
		return this.service.removeSoftware(id, softwareId);
	}

	@Put(`:${constants.entity_id}/software-list`)
	@ApiOperation({ summary: 'Update software list on device', description: 'Update the list of software on a specific device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Software list updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	updateSoftwareList(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDeviceSoftwareListDto): Promise<GetDto> {
		return this.service.updateSoftwareList(id, updateDto);
	}

	@Post(`:${constants.entity_id}/maintenance`)
	@RequirePrivileges({ and: [PrivilegeCode.LAB_ASSISTANT] })
	@ApiOperation({ summary: 'Create maintenance update', description: 'Create a maintenance update for a device' })
	@ApiParam({ name: constants.entity_id, description: 'Device ID', type: 'string' })
	@ApiResponse({ status: 201, description: 'Maintenance update created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
	async createMaintenanceUpdate(@Param(constants.entity_id) id: UUID, @Body() updateDto: MaintenanceUpdateDto, @CurrentUser() user: User): Promise<any> {
		return this.service.createMaintenanceUpdate(id, updateDto, user.id);
	}
}
