
/**********************/
/* CHANGE STARTS HERE */
/**********************/

import { Software } from 'src/database/softwares/software.entity';


/* Replace tips
    1- Replace the folder name with your module name (e.g. users, event-schedules, etc.)
    2- Use global find and replace, set the files to include to src/modules/your_module_name
    3- Replace Software (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    4- Replace softwares (Module) with the name of your module (e.g. users, event_schedules, etc.)
    5- Replace software (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateSoftwareDto as CreateDto,
    UpdateSoftwareDto as UpdateDto,
    SoftwareDto as GetDto,
    SoftwareListDto as GetListDto,
    SoftwarePagedDto as PagedDto,
    SoftwarePaginationInput as PaginationInput,
} from './dtos';

// Remove the following two lines and replace with import Software from the database

export { Software as Entity };

export { SoftwareService as Service } from './service';

export const constants = {
    singularName: 'software',
    pluralName: 'softwares',
    entity_id: 'software_id',
    entity_ids: 'software_ids',
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