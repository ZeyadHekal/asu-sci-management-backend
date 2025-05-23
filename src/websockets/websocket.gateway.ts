import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/service';
import { WebsocketService } from './websocket.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/users/user.entity';
import { ChannelType, WSEventType, getChannelName } from './websocket.interfaces';
import { ConfigService } from '@nestjs/config';
import { StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { UUID } from 'crypto';

@WebSocketGateway(undefined, {
	useFactory: (configService: ConfigService) => ({
		// Using root namespace by default
		path: configService.get('websocket.path'),
		cors: configService.get('websocket.cors'),
		pingTimeout: configService.get('websocket.pingTimeout'),
		pingInterval: configService.get('websocket.pingInterval'),
		transports: configService.get('websocket.transports'),
		maxConnections: configService.get('websocket.maxConnections'),
	}),
	inject: [ConfigService],
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(WebsocketGateway.name);

	@WebSocketServer()
	server: Server;

	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
		private readonly websocketService: WebsocketService,
		private readonly configService: ConfigService,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(StudentEventSchedule) private readonly studentEventScheduleRepository: Repository<StudentEventSchedule>,
	) {}

	afterInit(server: Server) {
		this.websocketService.setServer(server);
		this.logger.log(`WebSocket Server initialized on path: ${this.configService.get('websocket.path') || '/socket.io'}`);
	}

	async handleConnection(client: Socket) {
		this.logger.log(`Connection attempt from client ${client.id}`);
		this.logger.log(`Client handshake details: transport=${client.handshake.headers.upgrade}, query=${JSON.stringify(client.handshake.query)}`);

		try {
			// Extract token from handshake auth
			const token = this.extractToken(client);
			if (!token) {
				this.logger.warn(`Client ${client.id} tried to connect without token`);
				this.handleDisconnect(client);
				return;
			}

			// Verify and decode token
			this.logger.debug(`Attempting to verify token for client ${client.id}`);
			const payload = await this.jwtService.verifyAsync(token);

			if (!payload || !payload.user_id) {
				this.logger.warn(`Client ${client.id} provided invalid token`);
				this.handleDisconnect(client);
				return;
			}

			// Get user data directly from repository to access entity methods
			const userId = payload.user_id;
			this.logger.debug(`Looking up user ${userId} for client ${client.id}`);
			const user = await this.userRepository.findOne({
				where: { id: userId },
				relations: ['userType'],
			});

			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				this.handleDisconnect(client);
				return;
			}

			// Store user data in client object
			client.data.user = user;

			// Subscribe to personal channel (based on user id)
			const personalChannel = getChannelName(ChannelType.USER, user.id);
			client.join(personalChannel);

			// Subscribe to user type channel
			const userType = await user.userType;
			const userTypeChannel = getChannelName(ChannelType.USER_TYPE, userType.id);
			client.join(userTypeChannel);

			// If user is a student, subscribe to relevant event schedule channels
			if (userType.name.toLowerCase() === 'student') {
				await this.subscribeToStudentEventChannels(client, user.id);
			}

			this.logger.log(`Client connected: ${client.id}, User: ${user.username}, Channels: [${personalChannel}, ${userTypeChannel}]`);
		} catch (error) {
			this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
			this.logger.error(error.stack);
			this.handleDisconnect(client);
		}
	}

	private async subscribeToStudentEventChannels(client: Socket, studentId: UUID): Promise<void> {
		try {
			// Get upcoming event schedules for this student (next 7 days)
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const nextWeek = new Date(today);
			nextWeek.setDate(nextWeek.getDate() + 7);

			const studentSchedules = await this.studentEventScheduleRepository
				.createQueryBuilder('ses')
				.leftJoin('event_schedules', 'es', 'es.id = ses.eventSchedule_id')
				.leftJoin('events', 'e', 'e.id = es.event_id')
				.where('ses.student_id = :studentId', { studentId })
				.andWhere('es.dateTime >= :today', { today })
				.andWhere('es.dateTime < :nextWeek', { nextWeek })
				.andWhere('e.isExam = true')
				.select('ses.eventSchedule_id')
				.getRawMany();

			// Subscribe to each event schedule channel
			for (const schedule of studentSchedules) {
				const eventChannel = getChannelName(ChannelType.EVENT_SCHEDULE, schedule.ses_eventSchedule_id);
				client.join(eventChannel);
				this.logger.debug(`Student ${studentId} subscribed to event channel: ${eventChannel}`);
			}

			this.logger.log(`Student ${studentId} subscribed to ${studentSchedules.length} event schedule channels`);
		} catch (error) {
			this.logger.error(`Error subscribing student ${studentId} to event channels: ${error.message}`);
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
		client.disconnect();
	}

	private extractToken(client: Socket): string | null {
		const authHeader = client.handshake.auth.token || client.handshake.headers.authorization;

		if (!authHeader) {
			this.logger.debug(`No auth token found for client ${client.id}. Auth details: ${JSON.stringify(client.handshake.auth)}`);
			return null;
		}

		const parts = authHeader.split(' ');
		return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;
	}

	@SubscribeMessage(WSEventType.PING)
	handlePing(client: Socket) {
		this.logger.debug(`Received ping from client ${client.id}`);
		return {
			event: WSEventType.PONG,
			data: {
				timestamp: new Date().toISOString(),
				clientId: client.id,
				userId: client.data.user?.id || null,
				username: client.data.user?.username || null,
			},
		};
	}

	@SubscribeMessage('join_event_channels')
	async handleJoinEventChannels(client: Socket, data: { eventScheduleIds: UUID[] }) {
		if (!client.data.user) {
			client.emit('error', { message: 'Unauthorized' });
			return;
		}

		const { eventScheduleIds } = data;
		this.logger.debug(`Client ${client.id} requesting to join event channels: ${eventScheduleIds.join(', ')}`);

		try {
			// Verify student is enrolled in these event schedules
			const verifiedSchedules = await this.studentEventScheduleRepository
				.createQueryBuilder('ses')
				.where('ses.student_id = :studentId', { studentId: client.data.user.id })
				.andWhere('ses.eventSchedule_id IN (:...scheduleIds)', { scheduleIds: eventScheduleIds })
				.select('ses.eventSchedule_id')
				.getRawMany();

			const verifiedIds = verifiedSchedules.map((s) => s.ses_eventSchedule_id);

			// Join only verified channels
			for (const scheduleId of verifiedIds) {
				const eventChannel = getChannelName(ChannelType.EVENT_SCHEDULE, scheduleId);
				client.join(eventChannel);
				this.logger.debug(`Client ${client.id} joined event channel: ${eventChannel}`);
			}

			client.emit('event_channels_joined', {
				joinedChannels: verifiedIds,
				message: `Joined ${verifiedIds.length} event channels`,
			});
		} catch (error) {
			this.logger.error(`Error joining event channels for client ${client.id}: ${error.message}`);
			client.emit('error', { message: 'Failed to join event channels' });
		}
	}
}
