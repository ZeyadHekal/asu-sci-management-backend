import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UploadedFiles, UseInterceptors, Res, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { BaseController } from 'src/base/base.controller';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { CurrentUser, Public } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import * as imports from './imports';
import { EventService, GroupCalculationResult } from './service';
import * as dtos from './dtos';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { CreateEventDto, UpdateEventDto, EventDto, EventListDto, EventPaginationInput } from './dtos';
import { Event } from 'src/database/events/event.entity';
import { DeleteDto } from 'src/base/delete.dto';

const { constants } = imports;

@ApiTags('events')
@Controller(constants.plural_name)
export class EventController extends BaseController<Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto> {
	constructor(
		public readonly service: EventService,
		private readonly eventService: EventService,
	) {
		super(service, Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto);
	}

	@Post()
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.TEACH_COURSE, PrivilegeCode.MANAGE_COURSES] })
	@ApiOperation({ summary: 'Create event', description: 'Create a new event' })
	@ApiResponse({ type: EventDto, status: 201, description: 'Event created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createDto: CreateEventDto): Promise<EventDto> {
		return super.create(createDto);
	}

	@Get()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get all events', description: 'Retrieve all events' })
	@ApiResponse({ type: EventListDto, status: 200, description: 'Events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAll(): Promise<EventListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get paginated events', description: 'Retrieve events with pagination' })
	@ApiResponse({ type: dtos.EventPagedDto, status: 200, description: 'Paginated events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginated(@Query() input: EventPaginationInput): Promise<IPaginationOutput<EventDto | EventListDto>> {
		return super.getPaginated(input);
	}

	@Get('course/:courseId')
	@RequirePrivileges({ and: [PrivilegeCode.TEACH_COURSE] })
	@ApiOperation({ summary: 'Get events for a specific course', description: 'Retrieve all events for a specific course' })
	@ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
	@ApiResponse({ type: [EventListDto], status: 200, description: 'Course events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
	async getCourseEvents(@Param('courseId') courseId: UUID): Promise<EventListDto[]> {
		return this.eventService.getCourseEvents(courseId);
	}

	@Get('course/:courseId/export')
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.TEACH_COURSE, PrivilegeCode.MANAGE_COURSES] })
	@ApiOperation({ summary: 'Export course events', description: 'Export events for a specific course as Excel file' })
	@ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
	@ApiResponse({ status: 200, description: 'Events exported successfully' })
	async exportCourseEvents(@Param('courseId') courseId: UUID, @Res() res: Response) {
		const workbook = await this.eventService.exportCourseEventsToExcel(courseId);

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename=course-events-${courseId}.xlsx`);

		await workbook.xlsx.write(res);
		res.end();
	}

	// Student endpoints - accessible to all authenticated users
	@Get('student/exam-mode-status')
	@ApiOperation({ summary: 'Get student exam mode status' })
	@ApiResponse({ status: 200, description: 'Exam mode status retrieved', type: dtos.ExamModeStatusDto })
	async getStudentExamModeStatus(@CurrentUser() user: User): Promise<dtos.ExamModeStatusDto> {
		return await this.eventService.getStudentExamModeStatus(user.id);
	}

	@Get('student/schedule-ids')
	@ApiOperation({ summary: 'Get event schedule IDs for WebSocket listening' })
	@ApiResponse({ status: 200, description: 'Schedule IDs retrieved', type: [String] })
	async getStudentScheduleIds(@CurrentUser() user: User): Promise<UUID[]> {
		return await this.eventService.getStudentEventScheduleIds(user.id);
	}

	@Get('student/my-exams')
	@ApiOperation({ summary: 'Get student exams' })
	@ApiResponse({ status: 200, description: 'Student exams retrieved', type: [dtos.StudentExamDto] })
	async getStudentExams(@CurrentUser() user: User): Promise<dtos.StudentExamDto[]> {
		return await this.eventService.getStudentExams(user.id);
	}

	@Post('/student/:scheduleId/submit-files')
	@UseInterceptors(FilesInterceptor('files', 10))
	@ApiOperation({ summary: 'Submit files for exam' })
	@ApiConsumes('multipart/form-data')
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Files submitted successfully', type: dtos.FileSubmissionResponseDto })
	async submitFiles(
		@Param('scheduleId') scheduleId: UUID,
		@CurrentUser() user: User,
		@UploadedFiles() files: Express.Multer.File[]
	): Promise<dtos.FileSubmissionResponseDto> {
		return await this.eventService.submitStudentFiles(user.id, scheduleId, files);
	}

	@Get('student/:scheduleId/files')
	@ApiOperation({ summary: 'Get student\'s submitted files for an exam' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Files retrieved successfully', type: [dtos.StudentFileDto] })
	async getStudentFiles(
		@Param('scheduleId') scheduleId: UUID,
		@CurrentUser() user: User
	): Promise<dtos.StudentFileDto[]> {
		return await this.eventService.getStudentFiles(user.id, scheduleId);
	}

	@Delete('student/:scheduleId/files/:fileId')
	@ApiOperation({ summary: 'Delete a student\'s submitted file for a specific exam schedule' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiParam({ name: 'fileId', description: 'File ID' })
	@ApiResponse({ status: 200, description: 'File deleted successfully' })
	async deleteStudentFile(
		@Param('scheduleId') scheduleId: UUID,
		@Param('fileId') fileId: string,
		@CurrentUser() user: User
	): Promise<void> {
		await this.eventService.deleteStudentFile(user.id, scheduleId, fileId);
	}

	// Admin endpoints - require privileges
	@Get(':' + constants.entity_id)
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get event by ID', description: 'Retrieve an event by its ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event ID', type: 'string' })
	@ApiResponse({ type: EventDto, status: 200, description: 'Event retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event does not exist' })
	getById(@Param(constants.entity_id) id: UUID): Promise<EventDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.TEACH_COURSE, PrivilegeCode.MANAGE_COURSES] })
	@ApiOperation({ summary: 'Update event', description: 'Update an existing event by ID' })
	@ApiParam({ name: constants.entity_id, description: 'Event ID', type: 'string' })
	@ApiResponse({ type: EventDto, status: 200, description: 'Event updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Event does not exist' })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateEventDto): Promise<EventDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.TEACH_COURSE, PrivilegeCode.MANAGE_COURSES] })
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
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Calculate optimal exam groups and lab requirements' })
	@ApiParam({ name: 'id', description: 'Event ID' })
	@ApiResponse({ status: 200, description: 'Group calculation completed', type: dtos.GroupCalculationResultDto })
	async calculateGroups(@Param('id') id: UUID): Promise<GroupCalculationResult> {
		return await this.eventService.calculateExamGroups(id);
	}

	@Post(':id/create-groups')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Create exam groups and schedules' })
	@ApiParam({ name: 'id', description: 'Event ID' })
	@ApiResponse({ status: 201, description: 'Exam groups and schedules created successfully' })
	@HttpCode(HttpStatus.CREATED)
	async createGroups(@Param('id') id: UUID, @Body() createGroupsDto: dtos.CreateExamGroupsDto) {
		await this.eventService.createExamGroupsAndSchedules(id, createGroupsDto.schedules);
		return { message: 'Exam groups and schedules created successfully' };
	}

	@Post(':scheduleId/start')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Start exam manually' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Exam started successfully' })
	async startExam(@Param('scheduleId') scheduleId: UUID, @CurrentUser() user: User) {
		await this.eventService.startExam(scheduleId, user.id);
		return { message: 'Exam started successfully' };
	}

	@Post(':scheduleId/end')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'End exam manually' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Exam ended successfully' })
	async endExam(@Param('scheduleId') scheduleId: UUID, @CurrentUser() user: User) {
		await this.eventService.endExam(scheduleId, user.id);
		return { message: 'Exam ended successfully' };
	}

	@Post(':scheduleId/upload-exam-models')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@UseInterceptors(FilesInterceptor('examModels', 20))
	@ApiOperation({ summary: 'Upload multiple exam models for exam schedule' })
	@ApiConsumes('multipart/form-data')
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Exam models uploaded successfully', type: dtos.ExamModelsResponseDto })
	async uploadExamModels(
		@Param('scheduleId') scheduleId: UUID,
		@UploadedFiles() examModels: Express.Multer.File[]
	): Promise<dtos.ExamModelsResponseDto> {
		return await this.eventService.uploadExamModels(scheduleId, examModels);
	}

	@Get(':scheduleId/download-submissions')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Download all student submissions as compressed archive (RAR or tar.gz)' })
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Compressed archive file with all submissions' })
	async downloadSubmissions(
		@Param('scheduleId') scheduleId: UUID,
		@Res() res: Response
	) {
		const { buffer, filename } = await this.eventService.downloadAllSubmissions(scheduleId);

		// Determine content type based on file extension
		const isRar = filename.endsWith('.rar');
		const contentType = isRar ? 'application/x-rar-compressed' : 'application/gzip';

		res.set({
			'Content-Type': contentType,
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Content-Length': buffer.length.toString(),
			'Content-Transfer-Encoding': 'binary',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		});

		res.end(buffer, 'binary');
	}

	@Post(':scheduleId/upload-marks')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@UseInterceptors(FileInterceptor('marksFile'))
	@ApiOperation({ summary: 'Upload marks from Excel file' })
	@ApiConsumes('multipart/form-data')
	@ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
	@ApiResponse({ status: 200, description: 'Marks uploaded successfully', type: dtos.MarkUploadResponseDto })
	async uploadMarks(
		@Param('scheduleId') scheduleId: UUID,
		@UploadedFile() marksFile: Express.Multer.File
	): Promise<dtos.MarkUploadResponseDto> {
		return await this.eventService.uploadMarksFromExcel(scheduleId, marksFile);
	}

	@Post(':courseId/simulate-groups')
	@imports.ApiOperation({ summary: 'Simulate group creation for event scheduling' })
	@imports.ApiResponse({ status: 200, description: 'Group simulation data', type: imports.GroupCreationSimulationDto })
	async simulateGroupCreation(@Param('courseId') courseId: imports.UUID): Promise<imports.GroupCreationSimulationDto> {
		return this.service.simulateGroupCreation(courseId);
	}

	@Post(':courseId/simulate-groups/add-group')
	@imports.ApiOperation({ summary: 'Add a group to the simulation by selecting a lab' })
	@imports.ApiResponse({ status: 200, description: 'Group added to simulation', type: imports.GroupCreationSimulationDto })
	async addGroupToSimulation(
		@Param('courseId') courseId: imports.UUID,
		@Body() addGroupDto: dtos.AddGroupToSimulationDto
	): Promise<imports.GroupCreationSimulationDto> {
		return this.service.addGroupToSimulation(courseId, addGroupDto.labId, addGroupDto.proposedCapacity);
	}

	@Post(':courseId/simulate-groups/remove-group')
	@imports.ApiOperation({ summary: 'Remove a group from the simulation' })
	@imports.ApiResponse({ status: 200, description: 'Group removed from simulation', type: imports.GroupCreationSimulationDto })
	async removeGroupFromSimulation(
		@Param('courseId') courseId: imports.UUID,
		@Body() removeGroupDto: dtos.RemoveGroupFromSimulationDto
	): Promise<imports.GroupCreationSimulationDto> {
		return this.service.removeGroupFromSimulation(courseId, removeGroupDto.groupIndex);
	}

	@Post('create-with-groups')
	@imports.ApiOperation({ summary: 'Create event with complex group scheduling and exam models' })
	@imports.ApiResponse({ status: 201, description: 'Event created with groups', type: imports.Entity })
	async createEventWithGroups(@Body() createDto: imports.CreateEventWithGroupsDto): Promise<imports.Entity> {
		return this.service.createEventWithGroups(createDto);
	}

	@Post('upload-exam-model-files')
	@UseInterceptors(FilesInterceptor('files', 10)) // Support up to 10 files per upload
	@ApiOperation({ summary: 'Upload exam model files and get file IDs' })
	@ApiConsumes('multipart/form-data')
	@ApiResponse({ status: 200, description: 'Files uploaded successfully', type: dtos.UploadExamModelFilesResponseDto })
	async uploadExamModelFiles(
		@UploadedFiles() files: Express.Multer.File[]
	): Promise<dtos.UploadExamModelFilesResponseDto> {
		return this.service.uploadExamModelFiles(files);
	}

	@Post('move-student-groups')
	@imports.ApiOperation({ summary: 'Move student between groups' })
	@imports.ApiResponse({ status: 200, description: 'Student moved successfully' })
	async moveStudentBetweenGroups(@Body() moveDto: imports.MoveStudentBetweenGroupsDto): Promise<{ success: boolean; message: string }> {
		return this.service.moveStudentBetweenGroups(moveDto);
	}

	@Get(':courseId/student-grades')
	@imports.ApiOperation({ summary: 'Get student grades summary for a course' })
	@imports.ApiResponse({ status: 200, description: 'Student grades summary', type: [imports.StudentGradesSummaryDto] })
	async getStudentGradesSummary(@Param('courseId') courseId: imports.UUID): Promise<imports.StudentGradesSummaryDto[]> {
		return this.service.getStudentGradesSummary(courseId);
	}

	@Get('my-grades/:studentId')
	@imports.ApiOperation({ summary: 'Get my grades (for student dashboard)' })
	@imports.ApiResponse({ status: 200, description: 'My grades summary', type: [imports.StudentGradesSummaryDto] })
	async getMyGrades(@Param('studentId') studentId: imports.UUID): Promise<imports.StudentGradesSummaryDto[]> {
		return this.service.getMyGrades(studentId);
	}
}
