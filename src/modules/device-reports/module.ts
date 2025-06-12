import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReportService } from './service';
import { DeviceReportController } from './controller';
import { DeviceReport } from 'src/database/devices/devices_reports.entity';
import { Device } from 'src/database/devices/device.entity';
import { Software } from 'src/database/softwares/software.entity';
import { User } from 'src/database/users/user.entity';
import { DeviceMaintenanceHistory } from 'src/database/devices/device-maintenance-history.entity';
import { WebsocketModule } from '../../websockets/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DeviceReport, Device, Software, User, DeviceMaintenanceHistory]),
        WebsocketModule
    ],
    controllers: [DeviceReportController],
    providers: [DeviceReportService],
    exports: [DeviceReportService],
})
export class DeviceReportModule { } 