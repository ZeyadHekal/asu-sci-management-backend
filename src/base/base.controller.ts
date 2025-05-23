import { UUID } from 'crypto';
import { ManagementEntity } from './base.entity';
import { IBaseController } from './interfaces/interface.controller';
import { IService } from './interfaces/interface.service';
import { Body } from '@nestjs/common';
import { DeleteDto } from './delete.dto';
import { PaginationInput } from './pagination.input';
import { IPaginationOutput } from './interfaces/interface.pagination.output';

export class BaseController<Entity extends ManagementEntity, CreateDto, UpdateDto, GetDto, GetListDto, PageInput extends PaginationInput = PaginationInput>
	implements IBaseController<Entity, CreateDto, UpdateDto, GetDto, GetListDto, PageInput>
{
	constructor(
		public service: IService<Entity, CreateDto, UpdateDto, GetDto, GetListDto, PageInput>,
		private entity: new () => Entity,
		private createDto: new () => CreateDto,
		private updateDto: new () => UpdateDto,
		private getDto: new () => GetDto,
		private getListDto: new () => GetListDto,
	) {}

	create(@Body() createDto: CreateDto): Promise<GetDto> {
		return this.service.create(createDto);
	}

	getAll(): Promise<GetListDto[]> {
		return this.service.getAll();
	}

	getPaginated(input: PageInput, filter?: any): Promise<IPaginationOutput<GetListDto | GetDto>> {
		return this.service.getPaginated(input, filter);
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
