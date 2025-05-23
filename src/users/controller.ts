import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UploadedFile } from '@nestjs/common';
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
import {
	CreateStaffDto,
	CreateStudentDto,
	StaffDto,
	StudentDto,
	UpdateStaffDto,
	UpdateStudentDto,
	StudentPagedDto,
	StaffPagedDto,
	DoctorDto,
	DoctorPagedDto,
	StaffPaginationInput,
	UpdateUserPrivilegesDto,
} from './dtos';
import { FileUpload } from '../modules/files/decorators/file-upload.decorator';

@ApiTags('users')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
@Controller(constants.plural_name)
export class UserController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	// Doctor specific endpoints
	@Get('doctors')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_COURSES] })
	@ApiOperation({ summary: 'Get all doctors', description: 'Retrieve all users with TEACH_COURSE privilege' })
	@ApiResponse({ type: DoctorDto, isArray: true, status: 200, description: 'Doctors retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAllDoctors(): Promise<DoctorDto[]> {
		return this.service.getAllDoctors();
	}

	@Get('doctors/paginated')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_COURSES] })
	@ApiOperation({ summary: 'Get paginated doctors', description: 'Retrieve doctors with pagination' })
	@ApiResponse({ type: DoctorPagedDto, status: 200, description: 'Paginated doctors retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginatedDoctors(@Query() input: PaginationInput): Promise<DoctorPagedDto> {
		return this.service.getPaginatedDoctors(input);
	}

	// Student specific endpoints
	@Post('students')
	@FileUpload('photo', { prefix: 'students', isPublic: false })
	@ApiOperation({ summary: 'Create student', description: 'Create a new student user' })
	@ApiResponse({ type: StudentDto, status: 201, description: 'Student created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	createStudent(@Body() createDto: CreateStudentDto, @UploadedFile() photo?: Express.Multer.File): Promise<StudentDto> {
		return this.service.createStudent(createDto, photo);
	}

	@Get('students')
	@ApiOperation({ summary: 'Get all students', description: 'Retrieve all student users' })
	@ApiResponse({ type: StudentDto, isArray: true, status: 200, description: 'Students retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getAllStudents(): Promise<StudentDto[]> {
		return this.service.getAllStudents();
	}

	@Get('students/paginated')
	@ApiOperation({ summary: 'Get paginated students', description: 'Retrieve students with pagination' })
	@ApiResponse({ type: StudentPagedDto, status: 200, description: 'Paginated students retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginatedStudents(@Query() input: PaginationInput): Promise<StudentPagedDto> {
		return this.service.getPaginatedStudents(input);
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

	@Delete('students/:id')
	@ApiOperation({ summary: 'Delete student', description: 'Delete an existing student by ID' })
	@ApiParam({ name: 'id', description: 'Student ID', type: 'string' })
	@ApiResponse({ status: 204, description: 'Student deleted successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - User is not a student' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Student does not exist' })
	async deleteStudent(@Param('id') id: UUID): Promise<void> {
		return this.service.deleteStudent(id);
	}

	// Staff specific endpoints
	@Post('staff/:userTypeId')
	@ApiOperation({ summary: 'Create staff', description: 'Create a new staff user with specific user type' })
	@ApiParam({ name: 'userTypeId', description: 'User Type ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 201, description: 'Staff created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	createStaff(@Body() createDto: CreateStaffDto, @Param('userTypeId') userTypeId: UUID): Promise<StaffDto> {
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

	@Get('staff/paginated')
	@ApiOperation({
		summary: 'Get paginated staff',
		description:
			'Retrieve staff with pagination and filtering. Available filters: department (string), userType (string), status (boolean). Example: ?page=0&limit=10&department=Computer%20Science&userType=Doctor&status=true',
	})
	@ApiResponse({ type: StaffPagedDto, status: 200, description: 'Paginated staff retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	getPaginatedStaff(@Query() input: StaffPaginationInput): Promise<StaffPagedDto> {
		return this.service.getPaginatedStaff(input);
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
	@ApiOperation({
		summary: 'Update staff',
		description: 'Update an existing staff member by ID. Username cannot be changed. Email and userType can be updated.',
	})
	@ApiParam({ name: 'id', description: 'Staff ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 200, description: 'Staff updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data or email already in use' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff does not exist' })
	updateStaff(@Param('id') id: UUID, @Body() updateDto: UpdateStaffDto): Promise<StaffDto> {
		return this.service.updateStaff(id, updateDto);
	}

	@Delete('staff/:id')
	@ApiOperation({ summary: 'Delete staff', description: 'Delete an existing staff member by ID' })
	@ApiParam({ name: 'id', description: 'Staff ID', type: 'string' })
	@ApiResponse({ status: 204, description: 'Staff deleted successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - User is not a staff member' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff does not exist' })
	async deleteStaff(@Param('id') id: UUID): Promise<void> {
		return this.service.deleteStaff(id);
	}

	@Patch(':id/privileges')
	@ApiOperation({
		summary: 'Update user privileges',
		description:
			"Update a user's specific privileges by providing an array of privilege codes. This will replace all user-specific privileges (user type privileges remain unchanged).",
	})
	@ApiParam({ name: 'id', description: 'User ID', type: 'string' })
	@ApiResponse({ type: StaffDto, status: 200, description: 'User privileges updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid privilege codes' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - User does not exist' })
	updateUserPrivileges(@Param('id') id: UUID, @Body() updateDto: UpdateUserPrivilegesDto): Promise<StaffDto> {
		return this.service.updateUserPrivileges(id, updateDto);
	}
}
