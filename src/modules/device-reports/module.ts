import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReportService } from './service';
import { DeviceReportController } from './controller';
import { DeviceReport } from 'src/database/devices/devices_reports.entity';
import { Device } from 'src/database/devices/device.entity';
import { Software } from 'src/database/softwares/software.entity';
import { User } from 'src/database/users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DeviceReport, Device, Software, User])],
    controllers: [DeviceReportController],
    providers: [DeviceReportService],
    exports: [DeviceReportService],
})
export class DeviceReportModule { } 