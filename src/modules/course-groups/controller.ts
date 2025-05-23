import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import * as imports from './imports';
import { CourseGroupScheduleTableDto, CreateCourseGroupScheduleDto, UpdateCourseGroupScheduleDto, CourseGroupScheduleTablePaginationInput, LabCapacityDto, CourseGroupScheduleTablePagedDto } from './dtos';

@Controller(imports.constants.plural_name)
@imports.ApiTags(imports.constants.plural_name)
export class CourseGroupController {
	constructor(
		private readonly service: imports.Service,
	) {}

	@Post()
	@imports.ApiOperation({ summary: `Create a new ${imports.constants.singular_name}` })
	@imports.ApiResponse({ status: 201, description: 'Course group created successfully.', type: imports.GetDto })
	@imports.ApiResponse({ status: 400, description: 'Bad Request.' })
	async create(@Body() createDto: imports.CreateDto): Promise<imports.GetDto> {
		return this.service.create(createDto);
	}

	@Get()
	@imports.ApiOperation({ summary: `Get all ${imports.constants.plural_name}` })
	@imports.ApiResponse({ status: 200, description: 'Return all course groups.', type: imports.PagedDto })
	async getPaginated(@Query() input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
		return this.service.getPaginated(input);
	}

	@Get('schedule-table')
	@imports.ApiOperation({ summary: 'Get course group schedule table', description: 'Get course groups with scheduling information for table display' })
	@imports.ApiResponse({ status: 200, description: 'Return course group schedule table.', type: CourseGroupScheduleTablePagedDto })
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

	@Get('course/:courseId/default-group-students')
	@imports.ApiOperation({ summary: 'Get number of students in default group', description: 'Get the count of students assigned to the default group of a course' })
	@imports.ApiParam({ name: 'courseId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Return the number of students in default group.' })
	async getStudentsInDefaultGroup(@Param('courseId') courseId: imports.UUID): Promise<{ count: number }> {
		const count = await this.service.getStudentsInDefaultGroup(courseId);
		return { count };
	}

	@Get('assistant/:assistantId/course/:courseId')
	@imports.ApiOperation({ summary: 'Get groups assigned to an assistant for a specific course', description: 'Get all groups where the assistant teaches in a specific course' })
	@imports.ApiParam({ name: 'assistantId', type: 'string' })
	@imports.ApiParam({ name: 'courseId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Return assistant assigned groups.', type: [CourseGroupScheduleTableDto] })
	async getAssistantGroups(
		@Param('assistantId') assistantId: imports.UUID,
		@Param('courseId') courseId: imports.UUID,
	): Promise<CourseGroupScheduleTableDto[]> {
		return this.service.getAssistantGroups(assistantId, courseId);
	}

	@Get('lab/:labId/course/:courseId/available-devices')
	@imports.ApiOperation({ summary: 'Get available devices for a lab and course', description: 'Get the number of available devices in a lab that meet the course software requirements' })
	@imports.ApiParam({ name: 'labId', type: 'string' })
	@imports.ApiParam({ name: 'courseId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Return available devices information.', type: LabCapacityDto })
	async getAvailableDevicesForLab(
		@Param('labId') labId: imports.UUID,
		@Param('courseId') courseId: imports.UUID,
	): Promise<LabCapacityDto> {
		return this.service.getAvailableDevicesForLab(labId, courseId);
	}

	@Get('lab/:labId/course/:courseId/capacity')
	@imports.ApiOperation({ summary: 'Calculate lab capacity for a course', description: 'Calculate how many students can be accommodated in a lab for a specific course based on software requirements' })
	@imports.ApiParam({ name: 'labId', type: 'string' })
	@imports.ApiParam({ name: 'courseId', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Return lab capacity for the course.' })
	async calculateLabCapacityForCourse(
		@Param('labId') labId: imports.UUID,
		@Param('courseId') courseId: imports.UUID,
	): Promise<{ capacity: number }> {
		const capacity = await this.service.calculateLabCapacityForCourse(labId, courseId);
		return { capacity };
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
	@imports.ApiOperation({
		summary: `Delete a ${imports.constants.singular_name}`,
		description: 'Delete a course group. All students enrolled in this group will be automatically moved to the default group of the same course. Default groups cannot be deleted.'
	})
	@imports.ApiParam({ name: 'id', type: 'string' })
	@imports.ApiResponse({ status: 200, description: 'Course group deleted successfully and all students moved to default group.', type: imports.DeleteDto })
	@imports.ApiResponse({ status: 400, description: 'Cannot delete default groups.' })
	@imports.ApiResponse({ status: 404, description: 'Course group not found.' })
	async delete(@Param('id') id: imports.UUID): Promise<imports.DeleteDto> {
		return this.service.delete([id]);
	}

	@Patch(':id/reorder')
	@imports.ApiOperation({ summary: 'Reorder course groups' })
	@imports.ApiParam({ name: 'id', description: 'Course ID' })
	@imports.ApiBody({
		description: 'Array of group IDs in the desired order',
		schema: {
			type: 'object',
			properties: {
				groupIds: {
					type: 'array',
					items: { type: 'string', format: 'uuid' },
					description: 'Array of group IDs in desired order (default groups will be moved to end automatically)'
				}
			},
			required: ['groupIds']
		}
	})
	@imports.ApiResponse({ status: 200, description: 'Groups reordered successfully' })
	async reorderGroups(
		@Param('id') courseId: imports.UUID,
		@Body() body: { groupIds: imports.UUID[] }
	) {
		const result = await this.service.reorderGroups(courseId, body.groupIds);
		return { success: true, message: 'Groups reordered successfully', data: result };
	}

	@Get(':groupId/details')
	@imports.ApiOperation({ summary: 'Get group details with students' })
	@imports.ApiResponse({ status: 200, description: 'Group details retrieved successfully' })
	async getGroupDetails(@Param('groupId') groupId: imports.UUID) {
		return this.service.getGroupWithStudents(groupId);
	}

	@Get(':groupId/available-groups-for-move/:studentId')
	@imports.ApiOperation({ summary: 'Get available groups for moving a student' })
	@imports.ApiResponse({ status: 200, description: 'Available groups retrieved successfully' })
	async getAvailableGroupsForMove(
		@Param('groupId') groupId: imports.UUID,
		@Param('studentId') studentId: imports.UUID
	) {
		return this.service.getAvailableGroupsForMove(studentId, groupId);
	}

	@Post('move-student')
	@imports.ApiOperation({ summary: 'Move student between groups' })
	@imports.ApiResponse({ status: 200, description: 'Student moved successfully' })
	async moveStudentBetweenGroups(@Body() moveDto: {
		studentId: imports.UUID;
		fromGroupId: imports.UUID;
		toGroupId: imports.UUID;
	}) {
		return this.service.moveStudentBetweenGroups(
			moveDto.studentId,
			moveDto.fromGroupId,
			moveDto.toGroupId
		);
	}
}
