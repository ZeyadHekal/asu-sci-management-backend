import { PrivilegeDto } from './dtos';

export enum PrivilegeCode {
	MANAGE_USER_TYPES = 'MANAGE_USER_TYPES',
	MANAGE_USERS = 'MANAGE_USERS',
	CREATE_STUDENT = 'CREATE_STUDENT',
	STUDY_COURSE = 'STUDY_COURSE',
	TEACH_COURSE = 'TEACH_COURSE',
	ASSIST_IN_COURSE = 'ASSIST_IN_COURSE',
	LAB_MAINTENANCE = 'LAB_MAINTENANCE',
}

/**
 * Define each privilege that must exist in the database.
 * For each privilege:
 * - name: must match one value from PrivilegeCode enum
 * - group: a string to group privileges together
 * - requiresResource: boolean
 * - paramKey: if requiresResource is true, paramKey is the request param to read
 * - entityName: if requiresResource is true, must match one value from EntityName enum
 */
export const PRIVILEGE_SEED_DATA: PrivilegeDto[] = [
	{
		code: PrivilegeCode.MANAGE_USER_TYPES,
		friendlyName: 'Manage User Types',
		group: 'Admin',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.MANAGE_USERS,
		friendlyName: 'Manage Users',
		group: 'Secretary',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.CREATE_STUDENT,
		friendlyName: 'Create Students',
		group: 'Student',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.STUDY_COURSE,
		friendlyName: 'Study Course',
		group: 'Assistant',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.TEACH_COURSE,
		friendlyName: 'Teach Course',
		group: 'Doctor',
		requiresResource: true,
	},
	{
		code: PrivilegeCode.ASSIST_IN_COURSE,
		friendlyName: 'Assist In Course',
		group: 'Assistant',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.LAB_MAINTENANCE,
		friendlyName: 'Lab Maintenance',
		group: 'Maintenance',
		requiresResource: false,
	},
];
