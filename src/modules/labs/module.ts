import { Module } from '@nestjs/common';
import { LabService } from './service';
import { LabController } from './controller';

@Module({
	controllers: [LabController],
	providers: [LabService],
})
export class LabModule {}
