import { Module } from '@nestjs/common';
import { UserService } from './service';
import { UserController } from './controller';
import { UserTypeController } from '../users/user-types/controller';
import { UserTypeService } from '../users/user-types/service';

@Module({
	controllers: [UserTypeController, UserController],
	providers: [UserTypeService, UserService],
})
export class UserModule {}
