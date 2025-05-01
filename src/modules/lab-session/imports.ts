
/**********************/
/* CHANGE STARTS HERE */
/**********************/

import { LabSession } from 'src/database/lab_sessions/lab_session.entity';


/* Replace tips
    1- Replace the folder name with your module name (e.g. users, event-schedules, etc.)
    2- Use global find and replace, set the files to include to src/modules/your_module_name
    3- Replace LabSession (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    4- Replace lab-sessions (Module) with the name of your module (e.g. users, event_schedules, etc.)
    5- Replace lab-session (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateLabSessionDto as CreateDto,
    UpdateLabSessionDto as UpdateDto,
    LabSessionDto as GetDto,
    LabSessionListDto as GetListDto,
    LabSessionPagedDto as PagedDto,
    LabSessionPaginationInput as PaginationInput,
} from './dtos';

// Remove the following two lines and replace with import LabSession from the database

export { LabSession as Entity };

export { LabSessionService as Service } from './service';

export const constants = {
    singular_name: 'lab_session',
    plural_name: 'lab_sessions',
    entity_id: 'lab_session_id',
    entity_ids: 'lab_session_ids',
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