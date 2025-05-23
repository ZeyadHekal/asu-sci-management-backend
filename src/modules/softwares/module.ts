import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoftwareService } from './service';
import { SoftwareController } from './controller';
import { Software } from 'src/database/softwares/software.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Software])],
	controllers: [SoftwareController],
	providers: [SoftwareService],
})
export class SoftwareModule {}
