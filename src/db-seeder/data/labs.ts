export interface LabConfig {
	name: string;
	description?: string;
	supervisorUsername: string; // Will be linked to an existing user
}

export const LABS_CONFIG: LabConfig[] = [
	{
		name: 'Abd El Salam',
		description: 'Abd El Salam Computer Lab',
		supervisorUsername: 'admin', // Default admin user
	},
	{
		name: 'Bahaa',
		description: 'Bahaa Computer Lab',
		supervisorUsername: 'admin',
	},
	{
		name: 'Basement',
		description: 'Basement Computer Lab',
		supervisorUsername: 'admin',
	},
];
