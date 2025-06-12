import { CourseGroup } from 'src/database/courses/course-group.entity';

/**********************/
/* CHANGE STARTS HERE */
/**********************/

export {
	CreateCourseGroupDto as CreateDto,
	UpdateCourseGroupDto as UpdateDto,
	CourseGroupDto as GetDto,
	CourseGroupListDto as GetListDto,
	CourseGroupPagedDto as PagedDto,
	CourseGroupPaginationInput as PaginationInput,
	LabCapacityDto,
} from './dtos';

export { CourseGroup as Entity };

export { CourseGroupService as Service } from './service';

export const constants = {
	singular_name: 'course-group',
	plural_name: 'course-groups',
	entity_id: 'course_group_id',
	entity_ids: 'course_group_ids',
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
export { ApiResponse, ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
