import { UUID } from 'crypto';

/**
 * Base interface for all WebSocket messages
 */
export interface WSMessage<T = any> {
	event: string;
	data: T;
	timestamp?: string;
}

/**
 * Privilege change event data
 */
export interface PrivilegeChangeData {
	privilege: string;
	granted: boolean;
	timestamp: string;
	resourceIds?: UUID[] | null;
}

/**
 * Exam mode event data
 */
export interface ExamModeData {
	eventScheduleId: UUID;
	eventName: string;
	status: 'exam_mode_start' | 'exam_start' | 'exam_end';
	timestamp: string;
	timeRemaining?: number; // seconds
}

/**
 * Exam access event data
 */
export interface ExamAccessData {
	eventScheduleId: UUID;
	eventName: string;
	examFiles?: string;
	canAccess: boolean;
	timestamp: string;
}

/**
 * Channel definitions
 */
export enum ChannelType {
	USER = 'user',
	USER_TYPE = 'userType',
	EVENT_SCHEDULE = 'eventSchedule',
	COURSE = 'course',
	LAB = 'lab',
}

/**
 * Event types
 */
export enum WSEventType {
	PING = 'ping',
	PONG = 'pong',
	PRIVILEGE_CHANGE = 'privilege:change',
	NOTIFICATION = 'notification',
	ERROR = 'error',
	EXAM_MODE_START = 'exam:mode_start',
	EXAM_START = 'exam:start',
	EXAM_END = 'exam:end',
	EXAM_ACCESS_GRANTED = 'exam:access_granted',
	EXAM_ACCESS_REVOKED = 'exam:access_revoked',
}

/**
 * Generate a channel name from a channel type and ID
 */
export function getChannelName(type: ChannelType, id: UUID): string {
	return `${type}:${id}`;
}

/**
 * Get channel type and ID from a channel name
 */
export function parseChannelName(channelName: string): { type: ChannelType; id: UUID } | null {
	const parts = channelName.split(':');
	if (parts.length !== 2) {
		return null;
	}

	const [typeStr, id] = parts;
	const type = Object.values(ChannelType).find((t) => t === typeStr);

	if (!type || !id) {
		return null;
	}

	return { type, id: id as UUID };
}
