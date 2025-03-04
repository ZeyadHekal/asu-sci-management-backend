import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/module';
import { DatabaseModule } from 'src/database/module';
import { UserModule } from 'src/users/module';
import { AuthModule } from './auth/module';
import { LabsModule } from './labs/module';
import { EventsModule } from './events/module';
import { StudentsModule } from './students/module';
import { CoursesModule } from './courses/module';
import { EventSchedulesModule } from './event-schedules/module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env.local', '.env.dev', '.env.stage', '.env.prod', '.env'],
		}),
		DatabaseModule,
		PrivilegesModule,
		UserModule,
		AuthModule,
		LabsModule,
		EventsModule,
		StudentsModule,
		CoursesModule,
		EventSchedulesModule,
	],
})
export class AppModule {}
