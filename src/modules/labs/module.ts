import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabService } from './service';
import { LabController } from './controller';
import { Lab } from 'src/database/labs/lab.entity';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Lab, Device, User])],
	controllers: [LabController],
	providers: [LabService],
})
export class LabModule {}
