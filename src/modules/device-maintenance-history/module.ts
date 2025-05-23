import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceHistoryService } from './service';
import { MaintenanceHistoryController } from './controller';
import { DeviceMaintenanceHistory } from 'src/database/devices/device-maintenance-history.entity';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';
import { DeviceReport } from 'src/database/devices/devices_reports.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DeviceMaintenanceHistory, Device, User, DeviceReport])],
    controllers: [MaintenanceHistoryController],
    providers: [MaintenanceHistoryService],
    exports: [MaintenanceHistoryService],
})
export class DeviceMaintenanceHistoryModule { } 