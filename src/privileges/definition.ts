import { PrivilegeDto } from './dtos';
import { EntityName } from './entity-map';

export enum PrivilegeCode {
	ADMIN_PRIVILEGE = 'ADMIN_PRIVILEGE',
	SECRETARY_PRIVILEGE = 'SECRETARY_PRIVILEGE',
	STUDENT_PRIVILEGE = 'STUDENT_PRIVILEGE',
	DOCTOR_PRIVILEGE = 'DOCTOR_PRIVILEGE',
	ASSISTANT_PRIVILEGE = 'ASSISTANT_PRIVILEGE',
	LAB_MAINTENANCE_PRIVILEGE = 'LAB_MAINTENANCE_PRIVILEGE',
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
		code: PrivilegeCode.ADMIN_PRIVILEGE,
		friendlyName: 'Admin\'s privilege for managing user type and assigning privileges.',
		group: 'Admin',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.SECRETARY_PRIVILEGE,
		friendlyName: 'Secretary\'s privilege for adding students.',
		group: 'Secretary',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.STUDENT_PRIVILEGE,
		friendlyName: 'Student\'s role for accessing courses and exams.',
		group: 'Student',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.DOCTOR_PRIVILEGE,
		friendlyName: 'Doctor\'s role for managing courses.',
		group: 'Doctor',
		requiresResource: true,
	},
	{
		code: PrivilegeCode.ASSISTANT_PRIVILEGE,
		friendlyName: 'Assistant\'s role for interacting with labs.',
		group: 'Assistant',
		requiresResource: false,
	},
	{
		code: PrivilegeCode.LAB_MAINTENANCE_PRIVILEGE,
		friendlyName: 'Lab maintenance\'s role for checking devices.',
		group: 'Maintenance',
		requiresResource: false,
	},
];
