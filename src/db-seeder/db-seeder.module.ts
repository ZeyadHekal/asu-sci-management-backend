import { Global, Module } from '@nestjs/common';
import { PrivilegeSeeder } from '../db-seeder/seeders/privilege';
import { DatabaseSeeder } from './db-seeder.service';
import { UserTypeSeeder } from './seeders/user-types';
import { UserSeeder } from './seeders/users';
import { CourseSeeder } from './seeders/courses';
import { ProfessorSeeder } from './seeders/professors';
import { LabSeeder } from './seeders/labs';
import { DeviceSeeder } from './seeders/devices';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, DoctorCourse } from 'src/database/courses/course.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { Privilege, UserPrivilege } from 'src/database/privileges/privilege.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSpecification } from 'src/database/devices/device-specification.entity';

@Global()
@Module({
	imports: [ConfigModule, TypeOrmModule.forFeature([Course, DoctorCourse, User, UserType, Privilege, UserPrivilege, Lab, Device, DeviceSpecification])],
	providers: [DatabaseSeeder, PrivilegeSeeder, UserTypeSeeder, UserSeeder, CourseSeeder, ProfessorSeeder, LabSeeder, DeviceSeeder],
})
export class DatabaseSeederModule {}
