import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './service';
import { CreateStudentDto, CreateUserDto as CreateDto, UpdateUserDto as UpdateDto, UserDto as GetDto, UserListDto as GetListDto, UserPagedDto, UserPaginationInput } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { User as Entity } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PrivilegeCode } from 'src/privileges/definition';
import { RequirePrivileges } from 'src/privileges/guard/decorator';

@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
@Controller('users')
export class UserController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: UserService) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: GetDto })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Post('create-student')
	@ApiCreatedResponse({ type: GetDto })
	createStudent(@Body() createDto: CreateStudentDto): Promise<GetDto> {
		return this.service.createStudent(createDto);
	}

	@Get()
	@ApiOkResponse({ type: GetListDto })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiOkResponse({ type: UserPagedDto })
	getPaginated(@Query() input: UserPaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':user_id')
	@ApiOkResponse({ type: GetDto })
	getById(@Param('user_id') id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':user_id')
	@ApiOkResponse({ type: GetDto })
	update(@Param('user_id') id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':user_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('user_ids') ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
