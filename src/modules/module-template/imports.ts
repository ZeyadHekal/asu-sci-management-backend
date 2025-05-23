/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Replace the folder name with your module name (e.g. users, event-schedules, etc.)
    2- Use global find and replace, set the files to include to src/modules/your_module_name
    3- Replace Template (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    4- Replace templates (Module) with the name of your module (e.g. users, event_schedules, etc.)
    5- Replace template (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
	CreateTemplateDto as CreateDto,
	UpdateTemplateDto as UpdateDto,
	TemplateDto as GetDto,
	TemplateListDto as GetListDto,
	TemplatePagedDto as PagedDto,
	TemplatePaginationInput as PaginationInput,
} from './dtos';

// Remove the following two lines and replace with import Template from the database
import { ManagementEntity } from 'src/base/base.entity';
class Template extends ManagementEntity {}

export { Template as Entity };

export { TemplateService as Service } from './service';

export const constants = {
	singular_name: 'template',
	plural_name: 'templates',
	entity_id: 'template_id',
	entity_ids: 'template_ids',
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
export { ApiResponse } from '@nestjs/swagger';
