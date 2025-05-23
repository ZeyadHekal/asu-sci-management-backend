import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffRequest } from 'src/database/staff-requests/staff-request.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { StaffRequestController } from './staff-request.controller';
import { StaffRequestService } from './staff-request.service';
import { UserModule } from 'src/users/module';
import { FileModule } from 'src/modules/files/module';

@Module({
	imports: [TypeOrmModule.forFeature([StaffRequest, UserType, User]), UserModule, FileModule],
	controllers: [StaffRequestController],
	providers: [StaffRequestService],
	exports: [StaffRequestService],
})
export class StaffRequestModule {}
