import { In, Repository } from 'typeorm';
import { transformToInstance } from 'src/base/transformToInstance';
import { UUID } from 'crypto';
import { ManagementEntity } from './base.entity';
import { IService } from './interfaces/interface.service';
import { DeleteDto } from './delete.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginationInput } from './pagination.input';
import { IPaginationOutput } from './interfaces/interface.pagination.output';

export class BaseService<Entity extends ManagementEntity, CreateDto, UpdateDto, GetDto, GetListDto, PageInput extends PaginationInput = PaginationInput>
	implements IService<Entity, CreateDto, UpdateDto, GetDto, GetListDto, PageInput> {
	constructor(
		private entity: new () => Entity,
		private createDto: new () => CreateDto,
		private updateDto: new () => UpdateDto,
		private getDto: new () => GetDto,
		private getListDto: new () => GetListDto,
		protected repository: Repository<any>,
	) {}

	async create(createDto: CreateDto) {
		let entity = await this.mapDtoToEntity(await this.beforeCreateDto(createDto));
		entity = await this.beforeCreateEntity(entity);
		await entity.save();
		return this.mapEntityToGetDto(entity);
	}

	async getAll() {
		const entities = await this.repository.find();
		const result = [] as GetListDto[];
		for (const entity of entities) {
			result.push(await this.mapEntityToGetListDto(entity));
		}
		return result;
	}

	async getPaginated(input: PageInput, filter?: any): Promise<IPaginationOutput<GetListDto | GetDto>> {
		const [entities, total] = await this.repository.findAndCount({
			skip: input.limit * (input.page - 1),
			take: input.limit,
			order: {
				[input.sortBy]: input.sortOrder,
			},
			where: {
				...filter,
				... (input.ids.length > 0 ? { id: In(input.ids) } : {}),
			},
		});
		const result = [] as GetDto[];
		for (const entity of entities) {
			result.push(await this.mapEntityToGetDto(entity));
		}
		return {
			items: result,
			total,
		} as IPaginationOutput<GetListDto | GetDto>;
		return;
	}

	async getById(id: UUID) {
		const entity = await this.repository.findOneBy({ id });
		if (!entity) {
			throw new NotFoundException();
		}
		return this.mapEntityToGetDto(entity);
	}

	async update(id: UUID, updateDto: UpdateDto) {
		await this.repository.update(id, await this.beforeUpdateEntity(await this.mapDtoToEntity(await this.beforeUpdateDto(updateDto))));
		return this.getById(id);
	}

	async delete(id: UUID[]) {
		return transformToInstance(DeleteDto, this.repository.delete(id));
	}

	async beforeCreateDto(dto: CreateDto): Promise<CreateDto> {
		return dto;
	}

	async beforeUpdateDto(dto: UpdateDto): Promise<UpdateDto> {
		return dto;
	}

	async beforeCreateEntity(entity: Entity): Promise<Entity> {
		return entity;
	}

	async beforeUpdateEntity(entity: Entity): Promise<Entity> {
		return entity;
	}

	async mapDtoToEntity(dto: CreateDto | UpdateDto): Promise<Entity> {
		return transformToInstance(this.entity, dto);
	}

	async mapEntityToGetDto(entity: Entity): Promise<GetDto> {
		return transformToInstance(this.getDto, entity);
	}

	async mapEntityToGetListDto(entity: Entity): Promise<GetListDto> {
		return transformToInstance(this.getListDto, entity);
	}
}
