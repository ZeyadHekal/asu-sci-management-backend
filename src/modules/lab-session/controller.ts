import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
} from './imports';

@ApiTags('lab-sessions')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
@Controller(constants.plural_name)
export class LabSessionController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create lab session', description: 'Create a new lab session' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Lab session created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all lab sessions', description: 'Retrieve all lab sessions' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Lab sessions retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated lab sessions', description: 'Retrieve lab sessions with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated lab sessions retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get lab session by ID', description: 'Retrieve a lab session by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Lab Session ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Lab session retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Lab session does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update lab session', description: 'Update an existing lab session by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Lab Session ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Lab session updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Lab session does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete lab sessions', description: 'Delete one or multiple lab sessions by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated lab session IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Lab sessions deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more lab sessions do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
