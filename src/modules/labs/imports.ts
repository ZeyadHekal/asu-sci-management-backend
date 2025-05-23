import { Lab } from 'src/database/labs/lab.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace Lab (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace labs (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace lab (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
	CreateLabDto as CreateDto,
	UpdateLabDto as UpdateDto,
	LabDto as GetDto,
	LabListDto as GetListDto,
	LabPagedDto as PagedDto,
	LabPaginationInput as PaginationInput,
} from './dtos';

// Lab = Entity, remove the following line and import it from the database
// export { Lab as Entity } from 'src/database/labs/lab.entity';
export { Lab as Entity };

export { LabService as Service } from './service';

export const constants = {
	singular_name: 'lab',
	plural_name: 'labs',
	entity_id: 'lab_id',
	entity_ids: 'lab_ids',
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
