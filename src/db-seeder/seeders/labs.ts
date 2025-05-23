import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { LABS_CONFIG } from '../data/labs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LabSeeder {
	constructor(
		@InjectRepository(Lab) private labRepo: Repository<Lab>,
		@InjectRepository(User) private userRepo: Repository<User>,
		private configService: ConfigService,
	) {}

	public async seed() {
		for (const labConfig of LABS_CONFIG) {
			// Check if lab already exists
			const existingLab = await this.labRepo.findOneBy({ name: labConfig.name });

			if (existingLab) {
				console.log(`Lab ${labConfig.name} already exists, skipping creation`);
				continue;
			}

			// Find the supervisor user
			const supervisor = await this.userRepo.findOneBy({ username: labConfig.supervisorUsername });
			if (!supervisor) {
				console.warn(`Supervisor ${labConfig.supervisorUsername} not found. Skipping lab ${labConfig.name}`);
				continue;
			}

			// Create the lab
			const lab = this.labRepo.create({
				name: labConfig.name,
				location: labConfig.description || `${labConfig.name} Location`,
				supervisorId: supervisor.id,
			});

			await this.labRepo.save(lab);
			console.log(`Created lab: ${labConfig.name}`);
		}

		console.log('Lab seeding completed');
	}
}
