import { Repository } from 'typeorm';
import { transformToInstance } from 'src/base/transformToInstance';
import { UUID } from 'crypto';
import { ManagementEntity } from './base.entity';
import { IService } from './interface.service';
import { DeleteDto } from './delete.dto';
import { NotFoundException } from '@nestjs/common';

export class BaseService<Entity extends ManagementEntity, CreateDto, UpdateDto, GetDto, GetListDto>
	implements IService<Entity, CreateDto, UpdateDto, GetDto, GetListDto>
{
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

	// TODO: Implement
	async getPaginated(): Promise<GetListDto[]> {
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
