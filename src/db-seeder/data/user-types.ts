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
		privilegeCodes: [
			PrivilegeCode.MANAGE_SYSTEM,
			PrivilegeCode.MANAGE_STUDENTS,
			PrivilegeCode.MANAGE_LABS,
			PrivilegeCode.LAB_ASSISTANT,
			PrivilegeCode.STUDY_COURSE,
			PrivilegeCode.TEACH_COURSE,
			PrivilegeCode.ASSIST_IN_COURSE,
			PrivilegeCode.LAB_MAINTENANCE,
			PrivilegeCode.REPORT_DEVICE,
			PrivilegeCode.MANAGE_COURSES,
		],
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
		privilegeCodes: [PrivilegeCode.MANAGE_LABS, PrivilegeCode.LAB_MAINTENANCE, PrivilegeCode.REPORT_DEVICE],
		isDeletable: true,
	},
	{
		name: 'Assistant',
		description: 'Assists in teaching courses and managing laboratory resources',
		privilegeCodes: [PrivilegeCode.ASSIST_IN_COURSE, PrivilegeCode.LAB_ASSISTANT],
		isDeletable: true,
	},
	{
		name: 'Student',
		description: 'Regular student user with ability to report device issues',
		privilegeCodes: [PrivilegeCode.REPORT_DEVICE, PrivilegeCode.STUDY_COURSE],
		isDeletable: false,
	},
	{
		name: 'Doctor',
		description: 'Faculty member who can manage and teach courses',
		privilegeCodes: [PrivilegeCode.TEACH_COURSE],
		isDeletable: true,
	},
];
