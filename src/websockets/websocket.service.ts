import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { UUID } from 'crypto';
import { ChannelType, PrivilegeChangeData, WSEventType, getChannelName, ExamModeStatusChangeData } from './websocket.interfaces';

@Injectable()
export class WebsocketService {
	private server: Server = null;
	private readonly logger = new Logger(WebsocketService.name);

	setServer(server: Server) {
		this.server = server;
		this.logger.log('WebSocket server instance set in service');
		this.logger.log(`Server instance details: adapter=${server.adapter?.constructor?.name || 'unknown'}, engineIoAttached=${server.engine ? 'yes' : 'no'}`);

		// Add server-wide event listeners for debugging
		server.on('connection_error', (err) => {
			this.logger.error(`Socket.IO connection error: ${err.message}`, err);
		});

		server.on('new_namespace', (namespace) => {
			this.logger.log(`New namespace created: ${namespace.name}`);
		});

		// Log information about existing namespaces
		const namespaces = Array.from(server._nsps.keys());
		this.logger.log(`Active namespaces: ${namespaces.join(', ')}`);
	}

	/**
	 * Send a message to a specific user
	 * @param userId The ID of the user to send the message to
	 * @param event The event name
	 * @param data The message data
	 */
	sendToUser(userId: UUID, event: string, data: any) {
		if (!this.server) {
			this.logger.error('WebSocket server not initialized');
			return;
		}

		const channel = getChannelName(ChannelType.USER, userId);
		this.logger.debug(`Sending ${event} to ${channel}`);
		this.server.to(channel).emit(event, data);
	}

	/**
	 * Send a message to all users of a specific type
	 * @param userTypeId The ID of the user type
	 * @param event The event name
	 * @param data The message data
	 */
	sendToUserType(userTypeId: UUID, event: string, data: any) {
		if (!this.server) {
			this.logger.error('WebSocket server not initialized');
			return;
		}

		const channel = getChannelName(ChannelType.USER_TYPE, userTypeId);
		this.logger.debug(`Sending ${event} to ${channel}`);
		this.server.to(channel).emit(event, data);
	}

	/**
	 * Send a message to all connected clients
	 * @param event The event name
	 * @param data The message data
	 */
	broadcast(event: string, data: any) {
		if (!this.server) {
			this.logger.error('WebSocket server not initialized');
			return;
		}

		this.logger.debug(`Broadcasting ${event}`);
		this.server.emit(event, data);
	}

	/**
	 * Send a message to a specific channel
	 * @param channel The channel name
	 * @param event The event name
	 * @param data The message data
	 */
	emitToChannel(channel: string, event: string, data: any) {
		if (!this.server) {
			this.logger.error('WebSocket server not initialized');
			return Promise.resolve();
		}

		this.logger.debug(`Sending ${event} to channel ${channel}`);
		this.server.to(channel).emit(event, data);
		return Promise.resolve();
	}

	/**
	 * Send a privilege change notification to a user
	 * @param userId The user ID
	 * @param privilegeCode The privilege code
	 * @param granted Whether the privilege was granted or revoked
	 * @param resourceIds Optional list of resource IDs the privilege applies to
	 */
	notifyPrivilegeChange(userId: UUID, privilegeCode: string, granted: boolean, resourceIds?: UUID[] | null) {
		const data: PrivilegeChangeData = {
			privilege: privilegeCode,
			granted,
			timestamp: new Date().toISOString(),
			resourceIds,
		};

		this.sendToUser(userId, WSEventType.PRIVILEGE_CHANGE, data);
	}

	/**
	 * Send a privilege change notification to all users of a type
	 * @param userTypeId The user type ID
	 * @param privilegeCode The privilege code
	 * @param granted Whether the privilege was granted or revoked
	 * @param resourceIds Optional list of resource IDs the privilege applies to
	 */
	notifyUserTypePrivilegeChange(userTypeId: UUID, privilegeCode: string, granted: boolean, resourceIds?: UUID[] | null) {
		const data: PrivilegeChangeData = {
			privilege: privilegeCode,
			granted,
			timestamp: new Date().toISOString(),
			resourceIds,
		};

		this.sendToUserType(userTypeId, WSEventType.PRIVILEGE_CHANGE, data);
	}

	/**
	 * Send exam mode status change notification to a student
	 * @param userId The student user ID
	 * @param examModeStatus The exam mode status data
	 */
	notifyExamModeStatusChange(userId: UUID, examModeStatus: Omit<ExamModeStatusChangeData, 'timestamp'>) {
		const data: ExamModeStatusChangeData = {
			...examModeStatus,
			timestamp: new Date().toISOString(),
		};

		this.sendToUser(userId, WSEventType.EXAM_MODE_STATUS_CHANGE, data);
		this.logger.debug(`Sent exam mode status change to student ${userId}: ${data.isInExamMode ? 'ACTIVE' : 'INACTIVE'}`);
	}
}
