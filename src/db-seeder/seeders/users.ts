
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { hashSync } from 'bcrypt';

@Injectable()
export class UserSeeder {
    constructor(
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    public async seed() {
        const adminUserType = await this.userTypeRepo.findOneBy({ name: 'Admin' });
        if (!adminUserType) {
            throw new Error('Couldn\'t find Admin user type. Please ensure it is seeded before seeding users.');
        }
        const existingAdminUser = await this.userRepo.findOneBy({ username: 'admin' });
        if (!existingAdminUser) {
            const user = this.userRepo.create({
                username: 'admin',
                name: 'Admin',
                password: hashSync('Abcd@1234', 10),
                userTypeId: adminUserType.id,
            });
            await this.userRepo.save(user);
        }

    }
}
