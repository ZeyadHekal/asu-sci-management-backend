import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrivilegeSeeder } from "./seeders/privilege";
import { User } from "src/database/users/user.entity";
import { UserTypeSeeder } from "./seeders/user-types";
import { UserSeeder } from "./seeders/users";

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
    constructor(
        private readonly privilegeSeeder: PrivilegeSeeder,
        private readonly userTypeSeeder: UserTypeSeeder,
        private readonly userSeeder: UserSeeder,
    ) { }

    async onModuleInit() {
        await this.privilegeSeeder.seed();
        await this.userTypeSeeder.seed();
        await this.userSeeder.seed();
    }
}
