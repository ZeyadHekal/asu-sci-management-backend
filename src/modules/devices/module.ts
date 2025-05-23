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
import { DeviceLoginHistory } from 'src/database/devices/device-login-history.entity';
import { DeviceMaintenanceHistoryModule } from '../device-maintenance-history/module';
import { DeviceReportModule } from '../device-reports/module';
import { DeviceLoginHistoryModule } from '../device-login-history/module';
import { DeviceAccessGuard } from './guards/device-access.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([Device, Lab, User, UserType, DeviceSoftware, DeviceSpecification, DeviceLoginHistory]),
		DeviceMaintenanceHistoryModule,
		DeviceReportModule,
		DeviceLoginHistoryModule,
	],
	controllers: [DeviceController],
	providers: [DeviceService, DeviceAccessGuard],
	exports: [DeviceService],
})
export class DeviceModule {}
