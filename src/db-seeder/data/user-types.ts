import { PrivilegeCode } from 'src/db-seeder/data/privileges';

export interface UserTypeConfig {
	name: string;
	description: string;
	privilegeCodes: PrivilegeCode[];
	isDeletable?: boolean;
}

export const USER_TYPES_CONFIG: UserTypeConfig[] = [
	{
		name: 'Admin',
		description: 'System administrator with full system access and management capabilities',
		privilegeCodes: [PrivilegeCode.MANAGE_SYSTEM],
		isDeletable: false,
	},
	{
		name: 'Secretary',
		description: 'Responsible for managing student records and administrative tasks',
		privilegeCodes: [PrivilegeCode.MANAGE_STUDENTS],
		isDeletable: true,
	},
	{
		name: 'Lab Admin',
		description: 'Manages laboratory resources, equipment, and schedules',
		privilegeCodes: [PrivilegeCode.MANAGE_LABS],
		isDeletable: true,
	},
	{
		name: 'Student',
		description: 'Regular student user with ability to report device issues',
		privilegeCodes: [PrivilegeCode.REPORT_DEVICE],
		isDeletable: false,
	},
	{
		name: 'Doctor',
		description: 'Faculty member who can manage and teach courses',
		privilegeCodes: [PrivilegeCode.MANAGE_COURSES],
		isDeletable: true,
	},
];
