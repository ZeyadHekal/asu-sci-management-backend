import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { hashSync } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { USER_TYPES_CONFIG } from '../data/user-types';

@Injectable()
export class UserSeeder {
	constructor(
		@InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
		@InjectRepository(User) private userRepo: Repository<User>,
		private configService: ConfigService,
	) {}

	public async seed() {
		// Check if default users should be created (doesn't affect Admin which is always created)
		const createDefaultUsers = this.configService.get<string>('CREATE_DEFAULT_USERS') === 'true';

		// Create users for each user type
		for (const userTypeConfig of USER_TYPES_CONFIG) {
			// Skip non-admin users if CREATE_DEFAULT_USERS is not true
			if (userTypeConfig.name !== 'Admin' && !createDefaultUsers) {
				continue;
			}

			// Find the user type
			const userType = await this.userTypeRepo.findOneBy({ name: userTypeConfig.name });
			if (!userType) {
				console.warn(`Couldn't find ${userTypeConfig.name} user type. Skipping default user creation.`);
				continue;
			}

			// Generate username (lowercase with underscores instead of spaces)
			const username = userTypeConfig.name.toLowerCase().replace(/\s+/g, '_');

			// Check if user already exists
			const existingUser = await this.userRepo.findOneBy({ username });
			if (!existingUser) {
				// Create the user
				const user = this.userRepo.create({
					username,
					name: userTypeConfig.name,
					password: hashSync('Abcd@1234', 10),
					userTypeId: userType.id,
				});

				await this.userRepo.save(user);
				console.log(`Created default ${userTypeConfig.name} user: ${username}`);
			}
		}
	}
}
