import { UUID } from 'crypto';
import { PaginationInput } from '../pagination.input';
import { IPaginationOutput } from './interface.pagination.output';

export interface IService<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto, TPageInput extends PaginationInput = PaginationInput> {
	create(createDto: TCreateDto): Promise<TGetDto>;
	getAll(): Promise<TGetListDto[]>;
	getPaginated(input: TPageInput, filter: any): Promise<IPaginationOutput<TGetListDto | TGetDto>>;
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
