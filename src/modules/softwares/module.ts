import { Module } from '@nestjs/common';
import { SoftwareService } from './service';
import { SoftwareController } from './controller';

@Module({
	controllers: [SoftwareController],
	providers: [SoftwareService],
})
export class SoftwareModule {}
