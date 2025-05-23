import { PrivilegeDto } from '../../privileges/dtos';

export enum PrivilegeCode {
	MANAGE_SYSTEM = 'MANAGE_SYSTEM',
	MANAGE_USERS = 'MANAGE_USERS',
	MANAGE_STUDENTS = 'MANAGE_STUDENTS',
	MANAGE_LABS = 'MANAGE_LABS',
	LAB_ASSISTANT = 'LAB_ASSISTANT',
	STUDY_COURSE = 'STUDY_COURSE',
	TEACH_COURSE = 'TEACH_COURSE',
	ASSIST_IN_COURSE = 'ASSIST_IN_COURSE',
	LAB_MAINTENANCE = 'LAB_MAINTENANCE',
	REPORT_DEVICE = 'REPORT_DEVICE',
	MANAGE_COURSES = 'MANAGE_COURSES',
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
		code: PrivilegeCode.MANAGE_SYSTEM,
		friendlyName: 'Manage System',
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
		code: PrivilegeCode.MANAGE_STUDENTS,
		friendlyName: 'Manage Students',
		group: 'Student',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.MANAGE_LABS,
		friendlyName: 'Manage Labs',
		group: 'Labs',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.LAB_ASSISTANT,
		friendlyName: 'Lab Assistant',
		group: 'Labs',
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
	{
		code: PrivilegeCode.REPORT_DEVICE,
		friendlyName: 'Report Device',
		group: 'Student',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.MANAGE_COURSES,
		friendlyName: 'Manage Courses',
		group: 'Doctor',
		requiresResource: false,
	},
];
