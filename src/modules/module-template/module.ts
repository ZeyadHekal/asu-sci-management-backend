import { Module } from '@nestjs/common';
import { TemplateService } from './service';
import { TemplateController } from './controller';

@Module({
	controllers: [TemplateController],
	providers: [TemplateService],
})
export class TemplateModule {}
