import { Module } from '@nestjs/common';
import { LabController } from './controller';
import { LabService } from './service';
@Module({

    controllers: [LabController],
	providers: [LabService],
})
export class LabsModule {}

