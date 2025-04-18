import { ManagementEntity } from '../base.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace Template (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace templates (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace template (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateTemplateDto as CreateDto,
    UpdateTemplateDto as UpdateDto,
    TemplateDto as GetDto,
    TemplateListDto as GetListDto,
    TemplatePagedDto as PagedDto,
    TemplatePaginationInput as PaginationInput,
} from './dtos';

// Template = Entity, remove the following line and import it from the database
class Template extends ManagementEntity { }
// export { Template as Entity } from 'src/database/templates/template.entity';
export { Template as Entity };

export { TemplateService as Service } from './service';

export const constants = {
    singularName: 'template',
    pluralName: 'templates',
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
export { PrivilegeCode } from 'src/privileges/definition';
export { RequirePrivileges } from 'src/privileges/guard/decorator';
export { BaseController } from 'src/base/base.controller';
export { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';