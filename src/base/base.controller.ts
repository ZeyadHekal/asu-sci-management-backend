import { UUID } from 'crypto';
import { ManagementEntity } from './base.entity';
import { IBaseController } from './interface.controller';
import { IService } from './interface.service';
import { Body } from '@nestjs/common';
import { DeleteDto } from './delete.dto';

export class BaseController<Entity extends ManagementEntity, CreateDto, UpdateDto, GetDto, GetListDto>
	implements IBaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto>
{
	constructor(
		service: IService<Entity, CreateDto, UpdateDto, GetDto, GetListDto>,
		private entity: new () => Entity,
		private createDto: new () => CreateDto,
		private updateDto: new () => UpdateDto,
		private getDto: new () => GetDto,
		private getListDto: new () => GetListDto,
	) {
		this.service = service;
	}
	service: IService<Entity, CreateDto, UpdateDto, GetDto, GetListDto>;
	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return this.service.create(createDto);
	}
	getAll(): Promise<GetListDto[]> {
		return this.service.getAll();
	}
	// TODO: Implement pagination
	getPaginated(): Promise<GetListDto[]> {
		return this.service.getPaginated();
	}
	getById(id: UUID): Promise<GetDto> {
		return this.service.getById(id);
	}
	update(id: UUID, updateDto: UpdateDto): Promise<GetDto> {
		return this.service.update(id, updateDto);
	}
	delete(ids: string): Promise<DeleteDto> {
		return this.service.delete(ids.split(',') as any);
	}
}
