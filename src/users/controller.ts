import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiCreatedResponse, ApiOkResponse,
	RequirePrivileges, PrivilegeCode,
} from './imports';
import { CreateStudentDto } from './dtos';

@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
@Controller(constants.pluralName)
export class UserController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
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
	@ApiOkResponse({ type: PagedDto })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(constants.entity_id)
	@ApiOkResponse({ type: GetDto })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(constants.entity_id)
	@ApiOkResponse({ type: GetDto })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(constants.entity_ids)
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
