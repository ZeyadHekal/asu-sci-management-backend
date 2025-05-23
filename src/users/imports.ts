import { User } from 'src/database/users/user.entity';
export { User as Entity };

export {
	CreateUserDto as CreateDto,
	UpdateUserDto as UpdateDto,
	UserDto as GetDto,
	UserListDto as GetListDto,
	UserPagedDto as PagedDto,
	UserPaginationInput as PaginationInput,
} from './dtos';

export { UserService as Service } from './service';

export const constants = {
	singular_name: 'user',
	plural_name: 'users',
	entity_id: 'user_id',
	entity_ids: 'user_ids',
};

// Common
export { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
export { DeleteDto } from 'src/base/delete.dto';
export { UUID } from 'crypto';
export { PrivilegeCode } from 'src/db-seeder/data/privileges';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { BaseController } from 'src/base/base.controller';
export { ApiResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
