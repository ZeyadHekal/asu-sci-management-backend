import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UUID } from 'crypto';
import { User } from '../../../database/users/user.entity';
import { Device } from '../../../database/devices/device.entity';
import { PrivilegeCode } from '../../../db-seeder/data/privileges';
import { DEVICE_ACCESS_KEY, DeviceAccessOptions } from './device-access.decorator';

@Injectable()
export class DeviceAccessGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(Device) private deviceRepository: Repository<Device>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const deviceAccessOptions = this.reflector.getAllAndOverride<DeviceAccessOptions>(
            DEVICE_ACCESS_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!deviceAccessOptions) {
            return true; // No device access control required
        }

        const request = context.switchToHttp().getRequest();
        const user: User = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get device ID from request parameters
        const deviceId: UUID = request.params[deviceAccessOptions.deviceIdParam];

        if (!deviceId) {
            throw new ForbiddenException(`Device ID parameter '${deviceAccessOptions.deviceIdParam}' not found`);
        }

        // Check if user has device access
        const hasAccess = await this.checkDeviceAccess(user, deviceId, deviceAccessOptions);

        if (!hasAccess) {
            throw new ForbiddenException('You are not authorized to access this device');
        }

        return true;
    }

    private async checkDeviceAccess(
        user: User,
        deviceId: UUID,
        options: DeviceAccessOptions
    ): Promise<boolean> {
        // Get user privileges
        const userPrivileges = await this.getUserPrivileges(user);

        // Check if user has admin privileges that bypass device-specific checks
        if (options.allowManageLabs && userPrivileges.includes(PrivilegeCode.MANAGE_LABS)) {
            return true;
        }

        if (options.allowLabMaintenance && userPrivileges.includes(PrivilegeCode.LAB_MAINTENANCE)) {
            return true;
        }

        // If user doesn't have LAB_ASSISTANT privilege, deny access
        if (!userPrivileges.includes(PrivilegeCode.LAB_ASSISTANT)) {
            return false;
        }

        // For LAB_ASSISTANT users, check if they are assigned to this device
        const device = await this.deviceRepository.findOne({
            where: { id: deviceId },
            relations: ['lab']
        });

        if (!device) {
            return false; // Device not found
        }

        return device.assisstantId === user.id;
    }

    /**
     * Gets all privileges for a user (both direct and through user type)
     * @param user The user to get privileges for
     * @returns Array of privilege codes
     */
    private async getUserPrivileges(user: User): Promise<PrivilegeCode[]> {
        const userPrivileges = await user.getUserPrivileges();
        return Object.keys(userPrivileges) as PrivilegeCode[];
    }
} 