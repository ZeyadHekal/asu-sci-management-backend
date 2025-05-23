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

@ApiTags('labs')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
@Controller(constants.plural_name)
export class LabController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create lab', description: 'Create a new lab' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Lab created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all labs', description: 'Retrieve all labs' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Labs retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated labs', description: 'Retrieve labs with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated labs retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get lab by ID', description: 'Retrieve a lab by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Lab ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Lab retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Lab does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update lab', description: 'Update an existing lab by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Lab ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Lab updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Lab does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete labs', description: 'Delete one or multiple labs by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated lab IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Labs deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more labs do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
