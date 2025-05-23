import { StudentCourses } from 'src/database/students/student_courses.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

/* Replace tips
    1- Use global find and replace, set the files to include to src/modules/your_module_name
    2- Replace StudentCourse (Case-Sensitive!!!) (Module) with the name of your module (e.g. User, EventSchedule, etc.)
    3- Replace student-courses (Module) with the name of your module (e.g. users, event_schedules, etc.)
    4- Replace student-course (Module) with the name of your module (e.g. user, event_schedule, etc.)
*/

export {
	CreateStudentCourseDto as CreateDto,
	UpdateStudentCourseDto as UpdateDto,
	StudentCourseDto as GetDto,
	StudentCourseListDto as GetListDto,
	StudentCoursePagedDto as PagedDto,
	StudentCoursePaginationInput as PaginationInput,
	EnrollStudentDto,
	UpdateEnrollmentDto,
	AvailableCourseDto,
} from './dtos';

// StudentCourse = Entity, remove the following line and import it from the database
// export { StudentCourse as Entity } from 'src/database/student-courses/student-course.entity';
export { StudentCourses as Entity };

export { StudentCourseService as Service } from './service';

export const constants = {
	singular_name: 'student-course',
	plural_name: 'student-courses',
	entity_id: 'student_course_id',
	entity_ids: 'student_course_ids',
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
export { User } from 'src/database/users/user.entity';
