import { UUID } from 'crypto';

export interface IService<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto> {
	create(createDto: TCreateDto): Promise<TGetDto>;
	getAll(): Promise<TGetListDto[]>;
	// TODO: Pagination
	getPaginated(): Promise<TGetListDto[]>;
	getById(id: UUID): Promise<TGetDto>;
	update(id: UUID, updateDto: TUpdateDto): Promise<TGetDto>;
	delete(id: UUID[]): Promise<{ affected?: number }>;
	beforeCreateDto(dto: TCreateDto): Promise<TCreateDto>;
	beforeUpdateDto(dto: TUpdateDto): Promise<TUpdateDto>;
	beforeCreateEntity(entity: TEntity): Promise<TEntity>;
	beforeUpdateEntity(entity: TEntity): Promise<TEntity>;
	mapDtoToEntity(createOrUpdateDto: TCreateDto | TUpdateDto): Promise<TEntity>;
	mapEntityToGetDto(entity: TEntity): Promise<TGetDto>;
	mapEntityToGetListDto(entity: TEntity): Promise<TGetListDto>;
}
