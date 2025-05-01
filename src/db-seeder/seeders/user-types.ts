
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PrivilegeCode } from '../../privileges/definition';
import { Privilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserTypeSeeder {
    constructor(
        @InjectRepository(Privilege) private privilegeRepo: Repository<Privilege>,
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(UserTypePrivilege) private userTypePrivilegeRepo: Repository<UserTypePrivilege>,
    ) { }

    public async seed() {
        const adminUserType = await this.userTypeRepo.findOneBy({ name: 'Admin' });
        if (!adminUserType) {
            const privilege = await this.privilegeRepo.findOneBy({ code: PrivilegeCode.MANAGE_USER_TYPES });
            if (!privilege) {
                throw new Error('Privilege MANAGE_USER_TYPES not found. Please ensure it is seeded before seeding user types.');
            }


            const newAdminUserType = this.userTypeRepo.create({
                name: 'Admin', userTypePrivileges: Promise.resolve([
                    new UserTypePrivilege({
                        privilege: Promise.resolve(privilege),
                    }),
                ])
            });
            await this.userTypeRepo.save(newAdminUserType);
            const newUserTypePrivilege = this.userTypePrivilegeRepo.create({
                user_type_id: newAdminUserType.id,
                privilege_id: privilege.id,
            });
            await this.userTypePrivilegeRepo.save(newUserTypePrivilege);
        }
    }
}
