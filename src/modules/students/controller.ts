import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiResponse, ApiOperation, ApiTags, ApiParam,
	RequirePrivileges, PrivilegeCode,
} from './imports';

@ApiTags('students')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
	@Controller(constants.plural_name)
export class StudentController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create student', description: 'Create a new student' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Student created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all students', description: 'Retrieve all students' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Students retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated students', description: 'Retrieve students with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated students retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get student by ID', description: 'Retrieve a student by their ID' })
	@ApiParam({ name: constants.entity_id, description: 'Student ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Student retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Student does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update student', description: 'Update an existing student by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Student ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Student updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Student does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete students', description: 'Delete one or multiple students by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated student IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Students deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more students do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
