import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiResponse, ApiOperation, ApiTags, ApiParam,
	RequirePrivileges, PrivilegeCode,
} from './imports';
import { CreateStaffDto, CreateStudentDto, StaffDto, StudentDto, UpdateStaffDto, UpdateStudentDto } from './dtos';

@ApiTags('users')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
	@Controller(constants.plural_name)
export class UserController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	// Student specific endpoints
	@Post('students')
	@ApiOperation({ summary: 'Create student', description: 'Create a new student user' })
	@ApiResponse({ type: StudentDto, status: 201, description: 'Student created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	createStudent(@Body() createDto: CreateStudentDto): Promise<StudentDto> {
		return this.service.createStudent(createDto);
	}

	@Get('students')
	@ApiOperation({ summary: 'Get all students', description: 'Retrieve all student users' })
	@ApiResponse({ type: StudentDto, isArray: true, status: 200, description: 'Students retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAllStudents(): Promise<StudentDto[]> {
		return this.service.getAllStudents();
	}

	@Get('students/:id')
	@ApiOperation({ summary: 'Get student by ID', description: 'Retrieve a student by their ID' })
	@ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
	@ApiResponse({ type: StudentDto, status: 200, description: 'Student retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Student does not exist' })
	getStudentById(@Param('id') id: UUID): Promise<StudentDto> {
		return this.service.getStudentById(id);
	}

	@Patch('students/:id')
	@ApiOperation({ summary: 'Update student', description: 'Update an existing student by ID' })
	@ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
	@ApiResponse({ type: StudentDto, status: 200, description: 'Student updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Student does not exist' })
	updateStudent(@Param('id') id: UUID, @Body() updateDto: UpdateStudentDto): Promise<StudentDto> {
		return this.service.updateStudent(id, updateDto);
	}

	// Staff specific endpoints
	@Post('staff/:userTypeId')
	@ApiOperation({ summary: 'Create staff', description: 'Create a new staff user with specific user type' })
	@ApiParam({ name: 'userTypeId', description: 'User Type ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 201, description: 'Staff created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	createStaff(
		@Body() createDto: CreateStaffDto,
		@Param('userTypeId') userTypeId: UUID
	): Promise<StaffDto> {
		return this.service.createStaff(createDto, userTypeId);
	}

	@Get('staff')
	@ApiOperation({ summary: 'Get all staff', description: 'Retrieve all staff users' })
	@ApiResponse({ type: StaffDto, isArray: true, status: 200, description: 'Staff retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAllStaff(): Promise<StaffDto[]> {
		return this.service.getAllStaff();
	}

	@Get('staff/:id')
	@ApiOperation({ summary: 'Get staff by ID', description: 'Retrieve a staff member by their ID' })
	@ApiParam({ name: 'id', description: 'Staff ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 200, description: 'Staff retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff does not exist' })
	getStaffById(@Param('id') id: UUID): Promise<StaffDto> {
		return this.service.getStaffById(id);
	}

	@Patch('staff/:id')
	@ApiOperation({ summary: 'Update staff', description: 'Update an existing staff member by ID' })
	@ApiParam({ name: 'id', description: 'Staff ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 200, description: 'Staff updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff does not exist' })
	updateStaff(@Param('id') id: UUID, @Body() updateDto: UpdateStaffDto): Promise<StaffDto> {
		return this.service.updateStaff(id, updateDto);
	}
}
