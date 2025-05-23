import { PrivilegeDto } from '../../privileges/dtos';

export enum PrivilegeCode {
	MANAGE_SYSTEM = 'MANAGE_SYSTEM',
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
 * - code: must match one value from PrivilegeCode enum
 * - friendlyName: human readable name for the privilege
 * - group: a string to group privileges together
 * - requiresResource: boolean
 * - paramKey: if requiresResource is true, paramKey is the request param to read
 * - entityName: if requiresResource is true, must match one value from EntityName enum
 * - name: unique name for the privilege
 * - key: unique key for the privilege
 * - description: description of what the privilege allows
 * - category: category for grouping privileges
 * - isActive: whether the privilege is active
 */
export const PRIVILEGE_SEED_DATA: (PrivilegeDto & {
	name: string;
	key: string;
	description: string;
	category: string;
	isActive: boolean;
})[] = [
	{
		code: PrivilegeCode.MANAGE_SYSTEM,
		friendlyName: 'Manage System',
		group: 'Admin',
		requiresResource: false,
		name: 'System Management',
		key: 'MANAGE_SYSTEM',
		description: 'Full system administration capabilities',
		category: 'Administration',
		isActive: true,
	},
	{
		code: PrivilegeCode.MANAGE_STUDENTS,
		friendlyName: 'Manage Students',
		group: 'Student',
		requiresResource: false,
		name: 'Student Management',
		key: 'MANAGE_STUDENTS',
		description: 'Create, update, and manage student records',
		category: 'Student Management',
		isActive: true,
	},
	{
		code: PrivilegeCode.MANAGE_LABS,
		friendlyName: 'Manage Labs',
		group: 'Labs',
		requiresResource: false,
		name: 'Laboratory Management',
		key: 'MANAGE_LABS',
		description: 'Manage laboratory facilities and equipment',
		category: 'Laboratory',
		isActive: true,
	},
	{
		code: PrivilegeCode.LAB_ASSISTANT,
		friendlyName: 'Lab Assistant',
		group: 'Labs',
		requiresResource: false,
		name: 'Lab Assistant',
		key: 'LAB_ASSISTANT',
		description: 'Assist in laboratory sessions and activities',
		category: 'Laboratory',
		isActive: true,
	},
	{
		code: PrivilegeCode.STUDY_COURSE,
		friendlyName: 'Study Course',
		group: 'Assistant',
		requiresResource: false,
		name: 'Course Study',
		key: 'STUDY_COURSE',
		description: 'Access to study course materials and participate in courses',
		category: 'Academic',
		isActive: true,
	},
	{
		code: PrivilegeCode.TEACH_COURSE,
		friendlyName: 'Teach Course',
		group: 'Doctor',
		requiresResource: true,
		name: 'Course Teaching',
		key: 'TEACH_COURSE',
		description: 'Teach and manage specific courses',
		category: 'Academic',
		isActive: true,
	},
	{
		code: PrivilegeCode.ASSIST_IN_COURSE,
		friendlyName: 'Assist In Course',
		group: 'Assistant',
		requiresResource: false,
		name: 'Course Assistance',
		key: 'ASSIST_IN_COURSE',
		description: 'Assist in teaching and course management',
		category: 'Academic',
		isActive: true,
	},
	{
		code: PrivilegeCode.LAB_MAINTENANCE,
		friendlyName: 'Lab Maintenance',
		group: 'Maintenance',
		requiresResource: false,
		name: 'Lab Maintenance',
		key: 'LAB_MAINTENANCE',
		description: 'Perform maintenance tasks on laboratory equipment',
		category: 'Maintenance',
		isActive: true,
	},
	{
		code: PrivilegeCode.REPORT_DEVICE,
		friendlyName: 'Report Device',
		group: 'Student',
		requiresResource: false,
		name: 'Device Reporting',
		key: 'REPORT_DEVICE',
		description: 'Report issues with laboratory devices',
		category: 'Reporting',
		isActive: true,
	},
	{
		code: PrivilegeCode.MANAGE_COURSES,
		friendlyName: 'Manage Courses',
		group: 'Doctor',
		requiresResource: false,
		name: 'Course Management',
		key: 'MANAGE_COURSES',
		description: 'Create, update, and manage course offerings',
		category: 'Academic',
		isActive: true,
	},
];
