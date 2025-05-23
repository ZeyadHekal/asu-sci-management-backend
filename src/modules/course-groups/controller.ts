import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import * as imports from './imports';
import { CourseGroupCronService } from './course-group-cron.service';
import { CourseGroupScheduleTableDto, CreateCourseGroupScheduleDto, UpdateCourseGroupScheduleDto, CourseGroupScheduleTablePaginationInput } from './dtos';

@Controller(imports.constants.plural_name)
@imports.ApiTags(imports.constants.plural_name)
export class CourseGroupController {
	constructor(
		private readonly service: imports.Service,
		private readonly cronService: CourseGroupCronService,
	) {}

	@Post()
	@imports.ApiOperation({ summary: `Create a new ${imports.constants.singular_name}` })
	@imports.ApiResponse({ status: 201, description: 'Course group created successfully.', type: imports.GetDto })
	@imports.ApiResponse({ status: 400, description: 'Bad Request.' })
	async create(@Body() createDto: imports.CreateDto): Promise<imports.GetDto> {
		return this.service.create(createDto);
	}

	@Post('create-defaults')
	@imports.ApiOperation({ summary: 'Manually trigger default group creation', description: 'Manually create default groups for practical courses' })
	@imports.ApiResponse({ status: 200, description: 'Default groups creation triggered successfully.' })
	async createDefaultGroups() {
		return this.cronService.manuallyCreateDefaultGroups();
	}

	@Get()
	@imports.ApiOperation({ summary: `Get all ${imports.constants.plural_name}` })
	@imports.ApiResponse({ status: 200, description: 'Return all course groups.', type: imports.PagedDto })
	async getPaginated(@Query() input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
		return this.service.getPaginated(input);
	}

	@Get('schedule-table')
	@imports.ApiOperation({ summary: 'Get course group schedule table', description: 'Get course groups with scheduling information for table display' })
	@imports.ApiResponse({ status: 200, description: 'Return course group schedule table.', type: [CourseGroupScheduleTableDto] })
	async getScheduleTable(@Query() input: CourseGroupScheduleTablePaginationInput): Promise<imports.IPaginationOutput<CourseGroupScheduleTableDto>> {
		return this.service.getScheduleTable(input);
	}

	@Post('schedules')
	@imports.ApiOperation({ summary: 'Create course group schedule', description: 'Create a new schedule for a course group' })
	@imports.ApiResponse({ status: 201, description: 'Schedule created successfully.' })
	@imports.ApiResponse({ status: 400, description: 'Bad Request.' })
	async createSchedule(@Body() createDto: CreateCourseGroupScheduleDto) {
		return this.service.createSchedule(createDto);
	}

	@Patch('schedules/:courseGroupId/:assistantId')
	@imports.ApiOperation({ summary: 'Update course group schedule', description: 'Update a course group schedule' })
	@imports.ApiParam({ name: 'courseGroupId', type: 'string' })
	@imports.ApiParam({ name: 'assistantId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Schedule updated successfully.' })
	@imports.ApiResponse({ status: 404, description: 'Schedule not found.' })
	async updateSchedule(
		@Param('courseGroupId') courseGroupId: imports.UUID,
		@Param('assistantId') assistantId: imports.UUID,
		@Body() updateDto: UpdateCourseGroupScheduleDto,
	) {
		return this.service.updateSchedule(courseGroupId, assistantId, updateDto);
	}

	@Delete('schedules/:courseGroupId/:assistantId')
	@imports.ApiOperation({ summary: 'Delete course group schedule', description: 'Delete a course group schedule' })
	@imports.ApiParam({ name: 'courseGroupId', type: 'string' })
	@imports.ApiParam({ name: 'assistantId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Schedule deleted successfully.' })
	@imports.ApiResponse({ status: 404, description: 'Schedule not found.' })
	async deleteSchedule(@Param('courseGroupId') courseGroupId: imports.UUID, @Param('assistantId') assistantId: imports.UUID) {
		return this.service.deleteSchedule(courseGroupId, assistantId);
	}

	@Get(':id')
	@imports.ApiOperation({ summary: `Get a ${imports.constants.singular_name} by ID` })
	@imports.ApiParam({ name: 'id', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Return the course group.', type: imports.GetDto })
	@imports.ApiResponse({ status: 404, description: 'Course group not found.' })
	async getById(@Param('id') id: imports.UUID): Promise<imports.GetDto> {
		return this.service.getById(id);
	}

	@Patch(':id')
	@imports.ApiOperation({ summary: `Update a ${imports.constants.singular_name}` })
	@imports.ApiParam({ name: 'id', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Course group updated successfully.', type: imports.GetDto })
	@imports.ApiResponse({ status: 404, description: 'Course group not found.' })
	async update(@Param('id') id: imports.UUID, @Body() updateDto: imports.UpdateDto): Promise<imports.GetDto> {
		return this.service.update(id, updateDto);
	}

	@Delete(':id')
	@imports.ApiOperation({ summary: `Delete a ${imports.constants.singular_name}` })
	@imports.ApiParam({ name: 'id', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Course group deleted successfully.', type: imports.DeleteDto })
	@imports.ApiResponse({ status: 404, description: 'Course group not found.' })
	async delete(@Param('id') id: imports.UUID): Promise<imports.DeleteDto> {
		return this.service.delete([id]);
	}
}
