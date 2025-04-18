import { Module } from '@nestjs/common';
import { DeviceService } from './service';
import { DeviceController } from './controller';

@Module({
	controllers: [DeviceController],
	providers: [DeviceService],
})
export class DeviceModule {}
