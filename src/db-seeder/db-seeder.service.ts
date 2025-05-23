import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrivilegeSeeder } from './seeders/privilege';
import { User } from 'src/database/users/user.entity';
import { UserTypeSeeder } from './seeders/user-types';
import { UserSeeder } from './seeders/users';
import { CourseSeeder } from './seeders/courses';
import { ProfessorSeeder } from './seeders/professors';
import { LabSeeder } from './seeders/labs';
import { DeviceSeeder } from './seeders/devices';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
	constructor(
		private readonly privilegeSeeder: PrivilegeSeeder,
		private readonly userTypeSeeder: UserTypeSeeder,
		private readonly userSeeder: UserSeeder,
		private readonly courseSeeder: CourseSeeder,
		private readonly professorSeeder: ProfessorSeeder,
		private readonly labSeeder: LabSeeder,
		private readonly deviceSeeder: DeviceSeeder,
	) {}

	async onModuleInit() {
		await this.privilegeSeeder.seed();
		await this.userTypeSeeder.seed();
		await this.userSeeder.seed();
		await this.courseSeeder.seed();
		await this.professorSeeder.seed();
		await this.labSeeder.seed();
		await this.deviceSeeder.seed();
	}
}
