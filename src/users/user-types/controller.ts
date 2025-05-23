import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserTypeService } from './service';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeWithPrivilegeDto, UserTypePagedDto } from './dtos';
import { UUID } from 'crypto';
import { BaseController } from 'src/base/base.controller';
import { UserType } from 'src/database/users/user-type.entity';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { PrivilegeAssignmentDto } from 'src/privileges/dtos';

@ApiTags('user-types')
@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
@Controller('user-types')
export class UserTypeController extends BaseController<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {
	constructor(private readonly userTypeService: UserTypeService) {
		super(userTypeService, UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto);
	}

	@Post()
	@ApiOperation({ summary: 'Create user type', description: 'Create a new user type' })
	@ApiResponse({ type: UserTypeDto, status: 201, description: 'User type created successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	create(@Body() createUserDto: CreateUserTypeDto) {
		return this.userTypeService.create(createUserDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all user types', description: 'Retrieve all user types' })
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_SYSTEM, PrivilegeCode.MANAGE_USERS] })
	@ApiResponse({ type: UserTypeDto, isArray: true, status: 200, description: 'User types retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	findAll() {
		return this.getAll();
	}

	@Get('with-privileges')
	@ApiOperation({
		summary: 'Get all user types with privileges',
		description: 'Retrieve all user types with their associated privileges, with search and pagination',
	})
	@ApiResponse({ type: UserTypePagedDto, status: 200, description: 'User types with privileges retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	findAllWithPrivileges(@Query('search') search?: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
		return this.userTypeService.findAllWithPrivileges({ search, page, limit });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get user type by ID', description: 'Retrieve a user type by its ID' })
	@ApiParam({ name: 'id', description: 'User Type ID', type: 'string' })
	@ApiResponse({ type: UserTypeDto, status: 200, description: 'User type retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - User type does not exist' })
	getById(@Param('id') id: UUID) {
		return super.getById(id);
	}

	@Get(':id/privileges')
	@ApiOperation({ summary: 'Get user type privileges', description: 'Retrieve all privileges assigned to a specific user type' })
	@ApiParam({ name: 'id', description: 'User Type ID', type: 'string' })
	@ApiResponse({ type: PrivilegeAssignmentDto, isArray: true, status: 200, description: 'Privileges retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - User type does not exist' })
	async getPrivileges(@Param('id') id: UUID): Promise<PrivilegeAssignmentDto[]> {
		return this.userTypeService.getPrivileges(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update user type', description: 'Update an existing user type by ID' })
	@ApiParam({ name: 'id', description: 'User Type ID', type: 'string' })
	@ApiResponse({ type: UserTypeDto, status: 200, description: 'User type updated successfully' })
	@ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - User type does not exist' })
	update(@Param('id') id: UUID, @Body() updateUserDto: UpdateUserTypeDto) {
		return super.update(id, updateUserDto);
	}

	@Delete(':ids')
	@ApiOperation({ summary: 'Delete user types', description: 'Delete one or multiple user types by IDs' })
	@ApiParam({ name: 'ids', description: 'Comma-separated user type IDs', type: 'string' })
	@ApiResponse({ type: DeleteDto, status: 200, description: 'User types deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
	@ApiResponse({ status: 404, description: 'Not Found - One or more user types do not exist' })
	@ApiResponse({ status: 400, description: 'Bad Request - Cannot delete non-deletable user types' })
	delete(@Param('ids') ids: UUID) {
		return this.userTypeService.safeDelete(ids);
	}
}
