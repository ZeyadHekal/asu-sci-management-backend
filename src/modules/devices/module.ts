import { Module } from '@nestjs/common';
import { DeviceService } from './service';
import { DeviceController } from './controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from 'src/database/devices/device.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { DeviceSpecification } from 'src/database/devices/device-specification.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Device, Lab, User, UserType, DeviceSoftware, DeviceSpecification])],
	controllers: [DeviceController],
	providers: [DeviceService],
})
export class DeviceModule {}
