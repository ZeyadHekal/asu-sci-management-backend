import { Module } from '@nestjs/common';
import { UserService } from './service';
import { UserController } from './controller';
import { UserTypeController } from './user-types/controller';
import { UserTypeService } from './user-types/service';

@Module({
	controllers: [UserTypeController, UserController],
	providers: [UserTypeService, UserService],
})
export class UserModule {}
