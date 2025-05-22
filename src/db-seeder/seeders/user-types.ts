import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Privilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_TYPES_CONFIG } from '../config/user-types.config';

@Injectable()
export class UserTypeSeeder {
    constructor(
        @InjectRepository(Privilege) private privilegeRepo: Repository<Privilege>,
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(UserTypePrivilege) private userTypePrivilegeRepo: Repository<UserTypePrivilege>,
    ) { }

    public async seed() {
        // Create each user type if it doesn't exist
        for (const config of USER_TYPES_CONFIG) {
            const existingUserType = await this.userTypeRepo.findOneBy({ name: config.name });
            if (!existingUserType) {
                const privilege = await this.privilegeRepo.findOneBy({ code: config.privilegeCode });
                if (!privilege) {
                    throw new Error(`Privilege ${config.privilegeCode} not found. Please ensure it is seeded before seeding user types.`);
                }

                const newUserType = this.userTypeRepo.create({
                    name: config.name,
                    userTypePrivileges: Promise.resolve([
                        new UserTypePrivilege({
                            privilege: Promise.resolve(privilege),
                        }),
                    ])
                });

                await this.userTypeRepo.save(newUserType);

                const newUserTypePrivilege = this.userTypePrivilegeRepo.create({
                    user_type_id: newUserType.id,
                    privilege_id: privilege.id,
                });

                await this.userTypePrivilegeRepo.save(newUserTypePrivilege);
            }
        }
    }
}
