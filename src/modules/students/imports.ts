
/**********************/
/* CHANGE STARTS HERE */
/**********************/

import { Student } from 'src/database/students/student.entity';


/* Replace tips
    1- Replace the folder name with your module name (e.g. users, event-schedules, etc.)
    2- Use global find and replace, set the files to include to src/modules/your_module_name
    3- Replace Student (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    4- Replace students (Module) with the name of your module (e.g. users, event_schedules, etc.)
    5- Replace student (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
    CreateStudentDto as CreateDto,
    UpdateStudentDto as UpdateDto,
    StudentDto as GetDto,
    StudentListDto as GetListDto,
    StudentPagedDto as PagedDto,
    StudentPaginationInput as PaginationInput,
} from './dtos';

// Remove the following two lines and replace with import Student from the database

export { Student as Entity };

export { StudentService as Service } from './service';

export const constants = {
    singularName: 'student',
    pluralName: 'students',
    entity_id: 'student_id',
    entity_ids: 'student_ids',
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