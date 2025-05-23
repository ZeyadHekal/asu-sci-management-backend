import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
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
import { EventService, GroupCalculationResult, ExamModeStatus } from './service';
import * as dtos from './dtos';
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';

@ApiTags('events')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
@Controller(constants.plural_name)
export class EventController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(
		public readonly service: Service,
		private readonly eventService: EventService,
	) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create event', description: 'Create a new event' })
	@ApiResponse({ type: GetDto, status: 201, description: 'Event created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all events', description: 'Retrieve all events' })
	@ApiResponse({ type: GetListDto, status: 200, description: 'Events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOperation({ summary: 'Get paginated events', description: 'Retrieve events with pagination' })
	@ApiResponse({ type: PagedDto, status: 200, description: 'Paginated events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiOperation({ summary: 'Get event by ID', description: 'Retrieve an event by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Event retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiOperation({ summary: 'Update event', description: 'Update an existing event by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event ID', type: 'string' })
	@ApiResponse({ type: GetDto, status: 200, description: 'Event updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiOperation({ summary: 'Delete events', description: 'Delete one or multiple events by IDs' })
	@ApiParam({ name: constants.entity_ids, description: 'Comma-separated event IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'Events deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more events do not exist' })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}

	@Get(':id/calculate-groups')
	@ApiOperation({ summary: 'Calculate optimal exam groups and lab requirements' })
	@ApiParam({ name: 'id', description: 'Event ID' })
	@ApiResponse({ status: 200, description: 'Group calculation completed', type: dtos.GroupCalculationResultDto })
	async calculateGroups(@Param('id') id: UUID): Promise<GroupCalculationResult> {
		return await this.eventService.calculateExamGroups(id);
	}

	@Post(':id/create-groups')
	@ApiOperation({ summary: 'Create exam groups and schedules' })
	@ApiParam({ name: 'id', description: 'Event ID' })
	@ApiResponse({ status: 201, description: 'Exam groups and schedules created successfully' })
	@HttpCode(HttpStatus.CREATED)
	async createGroups(@Param('id') id: UUID, @Body() createGroupsDto: dtos.CreateExamGroupsDto) {
		await this.eventService.createExamGroupsAndSchedules(id, createGroupsDto.schedules);
		return { message: 'Exam groups and schedules created successfully' };
	}

	@Post(':scheduleId/start')
	@ApiOperation({ summary: 'Start exam manually' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Exam started successfully' })
	async startExam(@Param('scheduleId') scheduleId: UUID, @CurrentUser() user: User) {
		await this.eventService.startExam(scheduleId, user.id);
		return { message: 'Exam started successfully' };
	}

	@Post(':scheduleId/end')
	@ApiOperation({ summary: 'End exam manually' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Exam ended successfully' })
	async endExam(@Param('scheduleId') scheduleId: UUID, @CurrentUser() user: User) {
		await this.eventService.endExam(scheduleId, user.id);
		return { message: 'Exam ended successfully' };
	}

	@Get('student/exam-mode-status')
	@ApiOperation({ summary: 'Get student exam mode status' })
	@ApiResponse({ status: 200, description: 'Exam mode status retrieved', type: dtos.ExamModeStatusDto })
	async getStudentExamModeStatus(@CurrentUser() user: User): Promise<ExamModeStatus> {
		return await this.eventService.getStudentExamModeStatus(user.id);
	}

	@Get('student/schedule-ids')
	@ApiOperation({ summary: 'Get event schedule IDs for WebSocket listening' })
	@ApiResponse({ status: 200, description: 'Schedule IDs retrieved', type: [String] })
	async getStudentScheduleIds(@CurrentUser() user: User): Promise<UUID[]> {
		return await this.eventService.getStudentEventScheduleIds(user.id);
	}
}
