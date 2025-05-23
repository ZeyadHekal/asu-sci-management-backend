import { DeviceReport } from 'src/database/devices/devices_reports.entity';

export {
    CreateDeviceReportDto as CreateDto,
    UpdateDeviceReportDto as UpdateDto,
    DeviceReportDto as GetDto,
    DeviceReportListDto as GetListDto,
    DeviceReportPagedDto as PagedDto,
    DeviceReportPaginationInput as PaginationInput,
} from './dtos';

export { DeviceReport as Entity };

export const constants = {
    singular_name: 'device_report',
    plural_name: 'device-reports',
    entity_id: 'device_report_id',
    entity_ids: 'device_report_ids',
};

export { DeviceReportService as Service } from './service';

export { UUID } from 'crypto';
export { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
export { DeleteDto } from 'src/base/delete.dto';
export { BaseController } from 'src/base/base.controller';
export { BaseService } from 'src/base/base.service';
export { ApiResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { PrivilegeCode } from 'src/db-seeder/data/privileges'; 