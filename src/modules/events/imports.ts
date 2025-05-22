import { Event } from 'src/database/events/event.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace Event (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace events (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace event (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateEventDto as CreateDto,
    UpdateEventDto as UpdateDto,
    EventDto as GetDto,
    EventListDto as GetListDto,
    EventPagedDto as PagedDto,
    EventPaginationInput as PaginationInput,
} from './dtos';

// Event = Entity, remove the following line and import it from the database
// export { Event as Entity } from 'src/database/events/event.entity';
export { Event as Entity };

export { EventService as Service } from './service';

export const constants = {
    singular_name: 'event',
    plural_name: 'events',
    entity_id: 'event_id',
    entity_ids: 'event_ids',
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
export { ApiResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';