import { UUID } from 'crypto';
import { IService } from './interface.service';
import { DeleteDto } from './delete.dto';

export interface IBaseController<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto> {
	service: IService<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto>;
	create(createDto: TCreateDto): Promise<TGetDto>;
	getAll(): Promise<TGetListDto[]>;
	// TODO: Pagination
	getPaginated(): Promise<TGetListDto[]>;
	getById(id: UUID): Promise<TGetDto>;
	update(id: UUID, updateDto: TUpdateDto): Promise<TGetDto>;
	delete(ids: string): Promise<DeleteDto>;
}
