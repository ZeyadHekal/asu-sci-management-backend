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
 * Exam mode status change event data
 */
export interface ExamModeData {
	eventScheduleId: UUID;
	eventName: string;
	status: string;
	timestamp: string;
}

/**
 * Exam mode status change event data for students
 */
export interface ExamModeStatusChangeData {
	isInExamMode: boolean;
	examStartsIn?: number;
	examSchedules: {
		eventScheduleId: UUID;
		eventName: string;
		dateTime: Date;
		status: string;
	}[];
	timestamp: string;
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
	EXAM_STARTING_SOON = 'exam:starting_soon',
	EXAM_ACCESS_GRANTED = 'exam:access_granted',
	EXAM_ACCESS_REVOKED = 'exam:access_revoked',
	EXAM_MODE_STATUS_CHANGE = 'exam:mode_status_change',
	DEVICE_REPORT_CREATED = 'device_report:created',
	DEVICE_REPORT_UPDATED = 'device_report:updated',
	DEVICE_REPORT_STATUS_CHANGED = 'device_report:status_changed',
	DEVICE_REPORT_ASSIGNED = 'device_report:assigned',
	MAINTENANCE_HISTORY_CREATED = 'maintenance_history:created',
	MAINTENANCE_HISTORY_UPDATED = 'maintenance_history:updated',
	DEVICE_REPORT_COUNTER_UPDATE = 'device_report:counter_update',
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

/**
 * Device Report WebSocket event data structures
 */
export interface DeviceReportCreatedData {
	reportId: UUID;
	deviceId: UUID;
	deviceName?: string;
	reporterId?: UUID;
	reporterName?: string;
	description: string;
	status: string;
}

export interface DeviceReportUpdatedData {
	reportId: UUID;
	deviceId: UUID;
	deviceName?: string;
	oldStatus?: string;
	newStatus?: string;
	updatedBy?: UUID;
	updatedByName?: string;
	description?: string;
}

export interface DeviceReportStatusChangedData {
	reportId: UUID;
	oldStatus: string;
	newStatus: string;
	deviceId: UUID;
	deviceName?: string;
	updatedBy?: UUID;
	updatedByName?: string;
	fixMessage?: string;
}

export interface DeviceReportAssignedData {
	reportId: UUID;
	deviceId: UUID;
	deviceName?: string;
	assignedTo?: UUID;
	assignedToName?: string;
	assignedBy?: UUID;
	assignedByName?: string;
}

export interface MaintenanceHistoryCreatedData {
	maintenanceId: UUID;
	reportId?: UUID;
	deviceId: UUID;
	deviceName?: string;
	createdBy?: UUID;
	createdByName?: string;
	maintenanceType: string;
	status: string;
}

export interface MaintenanceHistoryUpdatedData {
	maintenanceId: UUID;
	reportId?: UUID;
	deviceId: UUID;
	deviceName?: string;
	updatedBy?: UUID;
	updatedByName?: string;
	maintenanceType: string;
	status: string;
}

export interface DeviceReportCounterUpdateData {
	deviceId: UUID;
	deviceName?: string;
	totalReports: number;
	pendingReports: number;
	inProgressReports: number;
	resolvedReports: number;
}
