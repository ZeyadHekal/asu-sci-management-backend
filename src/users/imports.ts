export {
    CreateUserDto as CreateDto,
    UpdateUserDto as UpdateDto,
    UserDto as GetDto,
    UserListDto as GetListDto,
    UserPagedDto as PagedDto,
    UserPaginationInput as PaginationInput,
} from './dtos';

export { User as Entity } from 'src/database/users/user.entity';

export { UserService as Service } from './service';

export const constants = {
    singularName: 'user',
    pluralName: 'users',
    entity_id: 'user_id',
    entity_ids: 'user_ids',
};

// Common
export { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
export { DeleteDto } from 'src/base/delete.dto';
export { UUID } from 'crypto';
export { PrivilegeCode } from 'src/privileges/definition';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { BaseController } from 'src/base/base.controller';
export { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';