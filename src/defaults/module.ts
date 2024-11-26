import { Module } from '@nestjs/common';
import { DefaultService } from './service';
import { DefaultController } from './controller';

@Module({
	controllers: [DefaultController],
	providers: [DefaultService],
})
export class UsersModule {}
