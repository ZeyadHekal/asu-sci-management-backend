import { LabSession } from 'src/database/lab_sessions/lab_session.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace LabSession (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace lab-session (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace lab_session (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
	CreateLabSessionDto as CreateDto,
	UpdateLabSessionDto as UpdateDto,
	LabSessionDto as GetDto,
	LabSessionListDto as GetListDto,
	LabSessionPagedDto as PagedDto,
	LabSessionPaginationInput as PaginationInput,
} from './dtos';

// LabSession = Entity, remove the following line and import it from the database
// export { LabSession as Entity } from 'src/database/lab_sessions/lab_session.entity';
export { LabSession as Entity };

export { LabSessionService as Service } from './service';

export const constants = {
	singular_name: 'lab_session',
	plural_name: 'lab-session',
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
export { PrivilegeCode } from 'src/db-seeder/data/privileges';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { BaseController } from 'src/base/base.controller';
export { ApiResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
