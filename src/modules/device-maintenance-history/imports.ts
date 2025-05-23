import { DeviceMaintenanceHistory } from 'src/database/devices/device-maintenance-history.entity';

export {
    CreateMaintenanceHistoryDto as CreateDto,
    UpdateMaintenanceHistoryDto as UpdateDto,
    MaintenanceHistoryDto as GetDto,
    MaintenanceHistoryListDto as GetListDto,
    MaintenanceHistoryPagedDto as PagedDto,
    MaintenanceHistoryPaginationInput as PaginationInput,
} from './dtos';

export { DeviceMaintenanceHistory as Entity };

export const constants = {
    singular_name: 'maintenance_history',
    plural_name: 'device-maintenance-history',
    entity_id: 'maintenance_history_id',
    entity_ids: 'maintenance_history_ids',
};

export { MaintenanceHistoryService as Service } from './service';

export { UUID } from 'crypto';
export { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
export { DeleteDto } from 'src/base/delete.dto';
export { BaseController } from 'src/base/base.controller';
export { BaseService } from 'src/base/base.service';
export { ApiResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { PrivilegeCode } from 'src/db-seeder/data/privileges'; 