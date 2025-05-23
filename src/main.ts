import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { defaultTransformOptions } from './base/transformToInstance';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule, { cors: true });

	// JSON BodyParser
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

	// Default validation & transformation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Removes properties not defined in the DTOs
			transform: true,
			transformOptions: defaultTransformOptions,
		}),
	);

	// Swagger configuration
	const config = new DocumentBuilder()
		.setTitle('ASU Science Management')
		.setDescription('API description for the management system')
		.setVersion('1.0')
		.addBearerAuth()
		.addSecurityRequirements('bearer')
		.addTag('asu-sci-management')
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory);

	// Use port 3001 to match client's expected port
	const port = process.env.PORT ?? 3001;
	await app.listen(port);
	logger.log(`Application is running on: http://localhost:${port}`);
	logger.log(`WebSocket server should be available at ws://localhost:${port}/socket.io`);
}
bootstrap();
