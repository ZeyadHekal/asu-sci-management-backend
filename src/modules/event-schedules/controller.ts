import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiResponse, ApiOperation, ApiTags, ApiParam,
	RequirePrivileges, PrivilegeCode,
} from './imports';

@ApiTags('event-schedules')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
	@Controller(constants.plural_name)
export class EventScheduleController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create event schedule', description: 'Create a new event schedule' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Event schedule created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all event schedules', description: 'Retrieve all event schedules' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Event schedules retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated event schedules', description: 'Retrieve event schedules with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated event schedules retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get event schedule by ID', description: 'Retrieve an event schedule by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event Schedule ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Event schedule retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event schedule does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update event schedule', description: 'Update an existing event schedule by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event Schedule ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Event schedule updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event schedule does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete event schedules', description: 'Delete one or multiple event schedules by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated event schedule IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Event schedules deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more event schedules do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
