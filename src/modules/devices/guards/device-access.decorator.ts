import { SetMetadata } from '@nestjs/common';

export const DEVICE_ACCESS_KEY = 'device_access';

export interface DeviceAccessOptions {
    /**
     * The parameter name that contains the device ID
     * @default 'device_id'
     */
    deviceIdParam?: string;
    /**
     * Whether to allow users with MANAGE_LABS privilege to bypass device-specific checks
     * @default true
     */
    allowManageLabs?: boolean;
    /**
     * Whether to allow users with LAB_MAINTENANCE privilege to bypass device-specific checks
     * @default true
     */
    allowLabMaintenance?: boolean;
}

/**
 * Decorator to protect endpoints that require device-specific access control.
 * This decorator ensures that LAB_ASSISTANT users can only access devices they are assigned to,
 * while users with MANAGE_LABS or LAB_MAINTENANCE privileges can access all devices.
 * 
 * @param options Configuration options for device access control
 */
export const RequireDeviceAccess = (options: DeviceAccessOptions = {}) =>
    SetMetadata(DEVICE_ACCESS_KEY, {
        deviceIdParam: 'device_id',
        allowManageLabs: true,
        allowLabMaintenance: true,
        ...options
    }); 