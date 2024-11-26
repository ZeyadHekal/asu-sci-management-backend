import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivilegeGroup } from './privileges/group.entity';
import { ParameterizedPrivilege } from './privileges/parameterized.entity';
import { Privilege } from './privileges/privilege.entity';
import { SimplePrivilege } from './privileges/simple.entity';
import { ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { UserType } from './users/user-type.entity';

@Global()
@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				type: 'mysql',
				host: configService.get<string>('DB_HOST', 'localhost'),
				port: configService.get<number>('DB_PORT', 3306),
				username: configService.get<string>('DB_USERNAME', 'root'),
				password: configService.get<string>('DB_PASSWORD', ''),
				database: configService.get<string>('DB_NAME', 'management_system'),
				synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // Use only in development
				logging: configService.get<boolean>('DB_LOGGING', false),
				autoLoadEntities: true,
			}),
		}),
		TypeOrmModule.forFeature([User, UserType, PrivilegeGroup, Privilege, SimplePrivilege, ParameterizedPrivilege]),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule {}
