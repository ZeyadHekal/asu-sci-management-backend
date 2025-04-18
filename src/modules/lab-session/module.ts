import { Module } from '@nestjs/common';
import { LabSessionService } from './service';
import { LabSessionController } from './controller';

@Module({
	controllers: [LabSessionController],
	providers: [LabSessionService],
})
export class LabSessionModule {}
