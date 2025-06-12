import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { UUID } from 'crypto';
import { DeviceLoginHistory, LoginStatus } from 'src/database/devices/device-login-history.entity';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';
import { CreateLoginHistoryDto, LoginHistoryDto, LoginHistoryPaginationInput } from './dtos';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';

@Injectable()
export class DeviceLoginHistoryService {
    constructor(
        @InjectRepository(DeviceLoginHistory)
        private readonly loginHistoryRepository: Repository<DeviceLoginHistory>,
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async createLoginRecord(createDto: CreateLoginHistoryDto): Promise<LoginHistoryDto> {
        // Verify device exists
        const device = await this.deviceRepository.findOneBy({ id: createDto.deviceId });
        if (!device) {
            throw new NotFoundException('Device not found');
        }

        // Verify user exists
        const user = await this.userRepository.findOneBy({ id: createDto.userId });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const loginRecord = this.loginHistoryRepository.create({
            ...createDto,
            loginTime: new Date(createDto.loginTime),
            logoutTime: createDto.logoutTime ? new Date(createDto.logoutTime) : undefined,
        });

        const savedRecord = await this.loginHistoryRepository.save(loginRecord);

        return {
            ...savedRecord,
            deviceName: device.name,
            userName: user.name,
        };
    }

    async findByDeviceId(deviceId: UUID, pagination: LoginHistoryPaginationInput): Promise<IPaginationOutput<LoginHistoryDto>> {
        // Verify device exists
        const device = await this.deviceRepository.findOneBy({ id: deviceId });
        if (!device) {
            throw new NotFoundException('Device not found');
        }

        const { page = 0, limit = 10, sortBy = 'loginTime', sortOrder = 'DESC' } = pagination;
        const skip = page * limit;

        const query = this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .leftJoinAndSelect('loginHistory.device', 'device')
            .leftJoinAndSelect('loginHistory.user', 'user')
            .where('loginHistory.deviceId = :deviceId', { deviceId })
            .skip(skip)
            .take(limit);

        if (sortBy && sortOrder) {
            query.orderBy(`loginHistory.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
        }

        if (pagination.userId) {
            query.andWhere('loginHistory.userId = :userId', { userId: pagination.userId });
        }

        if (pagination.ipAddress) {
            query.andWhere('loginHistory.ipAddress = :ipAddress', { ipAddress: pagination.ipAddress });
        }

        if (pagination.loginStatus) {
            query.andWhere('loginHistory.loginStatus = :loginStatus', { loginStatus: pagination.loginStatus });
        }

        const [loginHistories, total] = await query.getManyAndCount();

        const items = await Promise.all(
            loginHistories.map(async (history) => {
                const device = await history.device;
                const user = await history.user;

                return {
                    id: history.id,
                    deviceId: history.deviceId,
                    userId: history.userId,
                    ipAddress: history.ipAddress,
                    loginStatus: history.loginStatus,
                    loginTime: history.loginTime,
                    logoutTime: history.logoutTime,
                    sessionDuration: history.sessionDuration,
                    userAgent: history.userAgent,
                    operatingSystem: history.operatingSystem,
                    browser: history.browser,
                    failureReason: history.failureReason,
                    created_at: history.created_at,
                    updated_at: history.updated_at,
                    deviceName: device?.name || 'Unknown Device',
                    userName: user?.name || 'Unknown User',
                };
            })
        );

        return { items, total };
    }

    async updateLogoutTime(sessionId: UUID, logoutTime: Date): Promise<void> {
        const loginRecord = await this.loginHistoryRepository.findOneBy({ id: sessionId });
        if (!loginRecord) {
            throw new NotFoundException('Login session not found');
        }

        // Calculate session duration in minutes
        const sessionDuration = Math.floor((logoutTime.getTime() - loginRecord.loginTime.getTime()) / (1000 * 60));

        await this.loginHistoryRepository.update(sessionId, {
            logoutTime,
            sessionDuration,
        });
    }

    async findActiveSessionByUserAndDevice(userId: UUID, deviceId: UUID): Promise<DeviceLoginHistory | null> {
        return this.loginHistoryRepository.findOne({
            where: {
                userId,
                deviceId,
                loginStatus: LoginStatus.SUCCESS,
                logoutTime: null, // Still active session
            },
            order: { loginTime: 'DESC' },
        });
    }

    async logFailedLogin(deviceId: UUID, userId: UUID, ipAddress: string, failureReason: string, userAgent?: string): Promise<void> {
        const createDto: CreateLoginHistoryDto = {
            deviceId,
            userId,
            ipAddress,
            loginStatus: LoginStatus.FAILED,
            loginTime: new Date(),
            failureReason,
            userAgent,
        };

        await this.createLoginRecord(createDto);
    }

    async getLoginStatsByDevice(deviceId: UUID, days: number = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .select([
                'COUNT(*) as totalLogins',
                'COUNT(CASE WHEN loginHistory.loginStatus = :success THEN 1 END) as successfulLogins',
                'COUNT(CASE WHEN loginHistory.loginStatus = :failed THEN 1 END) as failedLogins',
                'COUNT(DISTINCT loginHistory.userId) as uniqueUsers',
            ])
            .where('loginHistory.deviceId = :deviceId', { deviceId })
            .andWhere('loginHistory.loginTime >= :startDate', { startDate })
            .setParameters({ success: LoginStatus.SUCCESS, failed: LoginStatus.FAILED })
            .getRawOne();

        return {
            totalLogins: parseInt(stats.totalLogins) || 0,
            successfulLogins: parseInt(stats.successfulLogins) || 0,
            failedLogins: parseInt(stats.failedLogins) || 0,
            uniqueUsers: parseInt(stats.uniqueUsers) || 0,
            period: `${days} days`,
        };
    }

    async findDeviceByIpAddress(ipAddress: string): Promise<Device | null> {
        return this.deviceRepository.findOne({
            where: { IPAddress: ipAddress }
        });
    }
} 