import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { UserController } from './controller';
import { UserService } from './service';
import { UserType } from 'src/database/users/user-type.entity';
import { FileModule } from '../modules/files/module';
import { UserTypeController } from './user-types/controller';
import { UserTypeService } from './user-types/service';
import { DoctorCourse, Course } from 'src/database/courses/course.entity';
import { UserPrivilege, Privilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { Student } from 'src/database/students/student.entity';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([User, UserType, DoctorCourse, Course, UserPrivilege, Privilege, UserTypePrivilege, Student]),
		FileModule
	],
	controllers: [UserTypeController, UserController],
	providers: [UserService, UserTypeService],
	exports: [UserService, UserTypeService],
})
export class UserModule { }
