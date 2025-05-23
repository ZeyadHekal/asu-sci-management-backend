import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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
import { MaintenanceHistoryPaginationInput } from './dtos';

@ApiTags('device-maintenance-history')
@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.MANAGE_LABS, PrivilegeCode.LAB_MAINTENANCE, PrivilegeCode.LAB_ASSISTANT] })
@Controller(constants.plural_name)
export class MaintenanceHistoryController {
    constructor(public readonly service: Service) { }

    @Post()
    @ApiOperation({ summary: 'Create maintenance history', description: 'Create a new maintenance history record' })
    @ApiResponse({ type: GetDto, status: 201, description: 'Maintenance history created successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async create(@Body() createDto: CreateDto): Promise<GetDto> {
        return this.service.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all maintenance history', description: 'Retrieve all maintenance history records' })
    @ApiResponse({ type: [GetListDto], status: 200, description: 'Maintenance history retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getAll(): Promise<GetListDto[]> {
        return this.service.findAll();
    }

    @Get('paginated')
    @ApiOperation({ summary: 'Get paginated maintenance history', description: 'Retrieve maintenance history with pagination' })
    @ApiResponse({ status: 200, description: 'Paginated maintenance history retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getPaginated(@Query() input: MaintenanceHistoryPaginationInput): Promise<IPaginationOutput<GetListDto>> {
        return this.service.getPaginated(input);
    }

    @Get('export/xlsx')
    @ApiOperation({ summary: 'Export maintenance history as XLSX', description: 'Export filtered maintenance history as Excel file' })
    @ApiResponse({ status: 200, description: 'Excel export successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async exportMaintenanceXlsx(@Query() input: MaintenanceHistoryPaginationInput, @Res() res: Response): Promise<void> {
        return this.service.exportMaintenanceXlsx(input, res);
    }

    @Get(':' + constants.entity_id)
    @ApiOperation({ summary: 'Get maintenance history by ID', description: 'Retrieve a maintenance history record by its ID' })
    @ApiParam({ name: constants.entity_id, description: 'Maintenance History ID', type: 'string' })
    @ApiResponse({ type: GetDto, status: 200, description: 'Maintenance history retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Maintenance history does not exist' })
    async getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
        return this.service.getById(id);
    }

    @Patch(':' + constants.entity_id)
    @ApiOperation({ summary: 'Update maintenance history', description: 'Update a maintenance history record' })
    @ApiParam({ name: constants.entity_id, description: 'Maintenance History ID', type: 'string' })
    @ApiResponse({ type: GetDto, status: 200, description: 'Maintenance history updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Maintenance history does not exist' })
    async update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
        return this.service.update(id, updateDto);
    }

    @Delete(':' + constants.entity_id)
    @ApiOperation({ summary: 'Delete maintenance history', description: 'Delete a maintenance history record' })
    @ApiParam({ name: constants.entity_id, description: 'Maintenance History ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Maintenance history deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Maintenance history does not exist' })
    async delete(@Param(constants.entity_id) id: UUID): Promise<{ affected: number }> {
        return this.service.delete(id);
    }
} 