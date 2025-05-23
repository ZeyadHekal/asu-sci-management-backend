import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
    Entity,
    CreateDto,
    UpdateDto,
    GetDto,
    GetListDto,
    IPaginationOutput,
    Service,
    constants,
    UUID,
    ApiResponse,
    ApiOperation,
    ApiTags,
    ApiParam,
    RequirePrivileges,
    PrivilegeCode,
} from './imports';
import { DeviceReportPaginationInput } from './dtos';
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';

@ApiTags('device-reports')
@Controller(constants.plural_name)
export class DeviceReportController {
    constructor(public readonly service: Service) { }

    // Student endpoint - Create a new report (requires REPORT_DEVICE privilege)
    @Post()
    @RequirePrivileges({ and: [PrivilegeCode.REPORT_DEVICE] })
    @ApiOperation({ summary: 'Create device report', description: 'Create a new device report (Students)' })
    @ApiResponse({ type: GetDto, status: 201, description: 'Device report created successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async create(@Body() createDto: CreateDto, @CurrentUser() user: User): Promise<GetDto> {
        return this.service.create(createDto, user.id);
    }

    // Student endpoint - Get my reports (requires REPORT_DEVICE privilege)
    @Get('my-reports')
    @RequirePrivileges({ and: [PrivilegeCode.REPORT_DEVICE] })
    @ApiOperation({ summary: 'Get my device reports', description: 'Get reports created by the current user (Students)' })
    @ApiResponse({ type: [GetListDto], status: 200, description: 'My device reports retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getMyReports(@Query() input: DeviceReportPaginationInput, @CurrentUser() user: User): Promise<IPaginationOutput<GetListDto>> {
        return this.service.getMyReports(user.id, input);
    }

    // Admin/Management endpoint - Get all reports
    @Get()
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get all device reports', description: 'Retrieve all device reports (Admin/Management)' })
    @ApiResponse({ type: [GetListDto], status: 200, description: 'Device reports retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getAll(): Promise<GetListDto[]> {
        return this.service.findAll();
    }

    // Admin/Management endpoint - Get paginated reports
    @Get('paginated')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get paginated device reports', description: 'Retrieve device reports with pagination (Admin/Management)' })
    @ApiResponse({ status: 200, description: 'Paginated device reports retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getPaginated(@Query() input: DeviceReportPaginationInput): Promise<IPaginationOutput<GetListDto>> {
        return this.service.getPaginated(input);
    }

    // Admin/Management endpoint - Get reports for a specific device
    @Get('device/:device_id')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get device reports', description: 'Get all reports for a specific device (Admin/Management)' })
    @ApiParam({ name: 'device_id', description: 'Device ID', type: 'string' })
    @ApiResponse({ type: [GetListDto], status: 200, description: 'Device reports retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getDeviceReports(@Param('device_id') deviceId: UUID, @Query() input: DeviceReportPaginationInput): Promise<IPaginationOutput<GetListDto>> {
        return this.service.getDeviceReports(deviceId, input);
    }

    // Admin/Management endpoint - Get report by ID
    @Get(':' + constants.entity_id)
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get device report by ID', description: 'Retrieve a device report by its ID (Admin/Management)' })
    @ApiParam({ name: constants.entity_id, description: 'Device Report ID', type: 'string' })
    @ApiResponse({ type: GetDto, status: 200, description: 'Device report retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Device report does not exist' })
    async getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
        return this.service.getById(id);
    }

    // Admin/Management endpoint - Update report
    @Patch(':' + constants.entity_id)
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Update device report', description: 'Update an existing device report by ID (Admin/Management)' })
    @ApiParam({ name: constants.entity_id, description: 'Device Report ID', type: 'string' })
    @ApiResponse({ type: GetDto, status: 200, description: 'Device report updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Device report does not exist' })
    async update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
        return this.service.update(id, updateDto);
    }

    // Admin/Management endpoint - Delete reports
    @Delete(':' + constants.entity_ids)
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Delete device reports', description: 'Delete one or multiple device reports by IDs (Admin/Management)' })
    @ApiParam({ name: constants.entity_ids, description: 'Comma-separated device report IDs', type: 'string' })
    @ApiResponse({ status: 200, description: 'Device reports deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - One or more device reports do not exist' })
    async delete(@Param(constants.entity_ids) ids: string): Promise<{ deletedCount: number }> {
        return this.service.delete(ids);
    }
} 