import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceLoginHistory } from 'src/database/devices/device-login-history.entity';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';
import { DeviceLoginHistoryService } from './service';
import { DeviceLoginHistoryController } from './controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([DeviceLoginHistory, Device, User])
    ],
    controllers: [DeviceLoginHistoryController],
    providers: [DeviceLoginHistoryService],
    exports: [DeviceLoginHistoryService]
})
export class DeviceLoginHistoryModule { } 