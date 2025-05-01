
/**********************/
/* CHANGE STARTS HERE */
/**********************/

import { Device } from 'src/database/devices/device.entity';


/* Replace tips
    1- Replace the folder name with your module name (e.g. users, event-schedules, etc.)
    2- Use global find and replace, set the files to include to src/modules/your_module_name
    3- Replace Device (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    4- Replace devices (Module) with the name of your module (e.g. users, event_schedules, etc.)
    5- Replace device (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateDeviceDto as CreateDto,
    UpdateDeviceDto as UpdateDto,
    DeviceDto as GetDto,
    DeviceListDto as GetListDto,
    DevicePagedDto as PagedDto,
    DevicePaginationInput as PaginationInput,
} from './dtos';

// Remove the following two lines and replace with import Device from the database

export { Device as Entity };

export { DeviceService as Service } from './service';

export const constants = {
    singularName: 'device',
    pluralName: 'devices',
    entity_id: 'device_id',
    entity_ids: 'device_ids',
};

/**********************/
/* CHANGE ENDS HERE */
/**********************/

// Common
export { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
export { DeleteDto } from 'src/base/delete.dto';
export { UUID } from 'crypto';
export { PrivilegeCode } from 'src/privileges/definition';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { BaseController } from 'src/base/base.controller';
export { ApiResponse } from '@nestjs/swagger';