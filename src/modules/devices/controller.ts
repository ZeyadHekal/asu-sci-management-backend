import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
	Entity, CreateDto, UpdateDto, GetDto, GetListDto, DeleteDto,
	PaginationInput, IPaginationOutput, PagedDto,
	BaseController, Service, constants, UUID,
	ApiResponse,
	RequirePrivileges, PrivilegeCode,
} from './imports';
import { DeviceSoftwarePagedDto } from '../softwares/dtos';

@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USERS] })
	@Controller(constants.plural_name)
export class DeviceController extends BaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto> {
	constructor(public readonly service: Service) {
		super(service, Entity, CreateDto, UpdateDto, GetDto, GetListDto);
	}

	@Post()
	@ApiResponse({ type: GetDto, status: 201 })
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiResponse({ type: GetListDto, status: 200 })
	getAll(): Promise<GetListDto[]> {
		return super.getAll();
	}

	@Get('paginated')
	@ApiResponse({ type: PagedDto, status: 200 })
	getPaginated(@Query() input: PaginationInput): Promise<IPaginationOutput<GetDto | GetListDto>> {
		return super.getPaginated(input);
	}

	@Get(':' + constants.entity_id)
	@ApiResponse({ type: GetDto, status: 200 })
	getById(@Param(constants.entity_id) id: UUID): Promise<GetDto> {
		return super.getById(id);
	}

	@Patch(':' + constants.entity_id)
	@ApiResponse({ type: GetDto, status: 200 })
	update(@Param(constants.entity_id) id: UUID, @Body() updateDto: UpdateDto): Promise<GetDto> {
		return super.update(id, updateDto);
	}

	@Delete(':' + constants.entity_ids)
	@ApiResponse({ type: DeleteDto, status: 200 })
	delete(@Param(constants.entity_ids) ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}

	// List all softwares for that device
	@Get(`:${constants.entity_id}/softwares`)
	@ApiResponse({ type: DeviceSoftwarePagedDto, isArray: true })
	async getSoftwares(@Param(constants.entity_id) id: UUID, @Query() input: PaginationInput): Promise<DeviceSoftwarePagedDto> {
		return this.service.getSoftwares(id, input);
	}

	// Add a new software to that device
}
