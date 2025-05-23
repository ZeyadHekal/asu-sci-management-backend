import { UUID } from 'crypto';
import { IService } from './interface.service';
import { DeleteDto } from '../delete.dto';
import { IPaginationOutput } from './interface.pagination.output';
import { PaginationInput } from '../pagination.input';

export interface IBaseController<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto, TPageInput = PaginationInput> {
	service: IService<TEntity, TCreateDto, TUpdateDto, TGetDto, TGetListDto>;
	create(createDto: TCreateDto): Promise<TGetDto>;
	getAll(): Promise<TGetListDto[]>;
	getPaginated(input: TPageInput): Promise<IPaginationOutput<TGetListDto | TGetDto>>;
	getById(id: UUID): Promise<TGetDto>;
	update(id: UUID, updateDto: TUpdateDto): Promise<TGetDto>;
	delete(ids: string): Promise<DeleteDto>;
}
