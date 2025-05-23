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
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';

@ApiTags('courses')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_COURSES] })
@Controller(constants.plural_name)
export class CourseController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create course', description: 'Create a new course' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Course created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all courses', description: 'Retrieve all courses' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Courses retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('my-courses')
	@RequirePrivileges({ and: [PrivilegeCode.TEACH_COURSE] })
	@ApiOperation({ summary: 'Get my courses', description: 'Retrieve courses where the current user is one of the doctors' })
	@ApiResponse({ type: GetListDto, isArray: true, status: 200, description: 'My courses retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async getMyCourses(@CurrentUser() user: User): Promise<GetListDto[]> {
		return this.service.getMyCourses(user.id);
	}

	@Get('statistics')
	@ApiOperation({ summary: 'Get course statistics', description: 'Retrieve course statistics and counts' })
	@ApiResponse({ status: 200, description: 'Course statistics retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async getStatistics() {
		return this.service.getCourseStatistics();
	}

	@Get('validate-data')
	@ApiOperation({ summary: 'Validate course data', description: 'Validate course data integrity and identify inconsistencies' })
	@ApiResponse({ status: 200, description: 'Course data validation completed successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async validateCourseData() {
		return this.service.validateCourseData();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated courses', description: 'Retrieve courses with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated courses retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get course by ID', description: 'Retrieve a course by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Course ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Course retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update course', description: 'Update an existing course by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Course ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Course updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete courses', description: 'Delete one or multiple courses by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated course IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Courses deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more courses do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
