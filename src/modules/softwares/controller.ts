import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiResponse, ApiOperation, ApiTags, ApiParam,
	RequirePrivileges, PrivilegeCode,
} from './imports';

@ApiTags('softwares')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
	@Controller(constants.plural_name)
export class SoftwareController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create software', description: 'Create a new software' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Software created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all software', description: 'Retrieve all software' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Software list retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated software', description: 'Retrieve software with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated software list retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get software by ID', description: 'Retrieve a software by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Software ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Software retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Software does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update software', description: 'Update an existing software by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Software ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Software updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Software does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete software', description: 'Delete one or multiple software by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated software IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Software deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more software do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
