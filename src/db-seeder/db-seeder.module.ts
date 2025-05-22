import { Global, Module } from '@nestjs/common';
import { PrivilegeSeeder } from '../db-seeder/seeders/privilege';
import { DatabaseSeeder } from './db-seeder.service';
import { UserTypeSeeder } from './seeders/user-types';
import { UserSeeder } from './seeders/users';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        DatabaseSeeder,
        PrivilegeSeeder,
        UserTypeSeeder,
        UserSeeder,
    ],
})
export class DatabaseSeederModule {}
