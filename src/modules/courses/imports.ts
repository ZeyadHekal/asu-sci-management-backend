import { Course } from 'src/database/courses/course.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace Course (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace courses (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace course (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
	CreateCourseDto as CreateDto,
	UpdateCourseDto as UpdateDto,
	CourseDto as GetDto,
	CourseListDto as GetListDto,
	CoursePagedDto as PagedDto,
	CoursePaginationInput as PaginationInput,
} from './dtos';

// Course = Entity, remove the following line and import it from the database
// export { Course as Entity } from 'src/database/courses/course.entity';
export { Course as Entity };

export { CourseService as Service } from './service';

export const constants = {
	singular_name: 'course',
	plural_name: 'courses',
	entity_id: 'course_id',
	entity_ids: 'course_ids',
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
