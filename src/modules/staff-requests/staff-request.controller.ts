import { Controller, Get, Post, Body, Param, Query, Put, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StaffRequestService } from './staff-request.service';
import { CreateStaffRequestDto, StaffRequestDto, StaffRequestPagedDto } from './dtos/staff-request.dto';
import { PaginationInput } from 'src/base/pagination.input';
import { UUID } from 'crypto';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { User } from 'src/database/users/user.entity';
import { CurrentUser } from 'src/auth/decorators';
import { RequirePrivileges } from 'src/users/imports';
import { FileUpload } from 'src/modules/files/decorators/file-upload.decorator';
import { Public } from 'src/auth/decorators';

@ApiTags('staff-requests')
@Controller('staff-requests')
export class StaffRequestController {
	constructor(private readonly staffRequestService: StaffRequestService) {}

	@Post()
	@Public()
	@FileUpload('idPhoto', { prefix: 'staff-requests' })
	@ApiOperation({ summary: 'Create staff request', description: 'Create a new staff request' })
	@ApiResponse({ type: StaffRequestDto, status: 201, description: 'Staff request created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	async create(@Body() createDto: CreateStaffRequestDto, @UploadedFile() idPhoto: Express.Multer.File): Promise<StaffRequestDto> {
		return this.staffRequestService.create(createDto, idPhoto);
	}

	@Get()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get all staff requests', description: 'Retrieve all staff requests with pagination' })
	@ApiResponse({ type: StaffRequestPagedDto, status: 200, description: 'Staff requests retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async findAll(@Query() input: PaginationInput): Promise<StaffRequestPagedDto> {
		return this.staffRequestService.findAll(input);
	}

	@Get('pending')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get pending staff requests', description: 'Retrieve pending staff requests with pagination' })
	@ApiResponse({ type: StaffRequestPagedDto, status: 200, description: 'Pending staff requests retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	async findPending(@Query() input: PaginationInput): Promise<StaffRequestPagedDto> {
		return this.staffRequestService.findPending(input);
	}

	@Get(':id')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Get staff request by ID', description: 'Retrieve a staff request by its ID' })
	@ApiResponse({ type: StaffRequestDto, status: 200, description: 'Staff request retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff request does not exist' })
	async findOne(@Param('id') id: UUID): Promise<StaffRequestDto> {
		return this.staffRequestService.findOne(id);
	}

	@Put(':id/approve')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Approve staff request', description: 'Approve a pending staff request' })
	@ApiResponse({ type: StaffRequestDto, status: 200, description: 'Staff request approved successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Request is not pending' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff request does not exist' })
	async approve(@Param('id') id: UUID, @CurrentUser() user: User, @Body('userTypeId') userTypeId: UUID): Promise<StaffRequestDto> {
		return this.staffRequestService.approve(id, user.id, userTypeId);
	}

	@Put(':id/reject')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiOperation({ summary: 'Reject staff request', description: 'Reject a pending staff request' })
	@ApiResponse({ type: StaffRequestDto, status: 200, description: 'Staff request rejected successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Request is not pending or no reason provided' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - Staff request does not exist' })
	async reject(@Param('id') id: UUID, @Body('reason') reason: string): Promise<StaffRequestDto> {
		return this.staffRequestService.reject(id, reason);
	}
}
