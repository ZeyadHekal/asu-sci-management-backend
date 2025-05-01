

/**********************/
/* CHANGE STARTS HERE */
/**********************/

import { EventSchedule } from 'src/database/events/event_schedules.entity';

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace EventSchedule (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace event_schedules (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace event_schedule (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateEventScheduleDto as CreateDto,
    UpdateEventScheduleDto as UpdateDto,
    EventScheduleDto as GetDto,
    EventScheduleListDto as GetListDto,
    EventSchedulePagedDto as PagedDto,
    EventSchedulePaginationInput as PaginationInput,
} from './dtos';

// EventSchedule = Entity, remove the following line and import it from the database
// export { EventSchedule as Entity } from 'src/database/event_schedules/event_schedule.entity';
export { EventSchedule as Entity };

export { EventScheduleService as Service } from './service';

export const constants = {
    singular_name: 'event_schedule',
    plural_name: 'event_schedules',
    entity_id: 'event_schedule_id',
    entity_ids: 'event_schedule_ids',
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