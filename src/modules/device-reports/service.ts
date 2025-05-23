import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as imports from './imports';
import { Device } from 'src/database/devices/device.entity';
import { Software } from 'src/database/softwares/software.entity';
import { User } from 'src/database/users/user.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { DeviceReportPaginationInput } from './dtos';
import { UUID } from 'crypto';

@Injectable()
export class DeviceReportService {
    constructor(
        @InjectRepository(imports.Entity) private readonly repository: Repository<imports.Entity>,
        @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
        @InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) { }

    async create(createDto: imports.CreateDto, userId?: UUID): Promise<imports.GetDto> {
        // Validate device exists
        const device = await this.deviceRepository.findOneBy({ id: createDto.deviceId });
        if (!device) {
            throw new NotFoundException('Device not found');
        }

        // Validate software exists
        const software = await this.softwareRepository.findOneBy({ id: createDto.appId });
        if (!software) {
            throw new NotFoundException('Software not found');
        }

        // If reporterId is provided, validate user exists
        if (createDto.reporterId) {
            const user = await this.userRepository.findOneBy({ id: createDto.reporterId });
            if (!user) {
                throw new NotFoundException('Reporter not found');
            }
        }

        // Set reporterId to current user if not provided
        const reporterId = createDto.reporterId || userId;
        if (!reporterId) {
            throw new ForbiddenException('Reporter ID is required');
        }

        const report = this.repository.create({ ...createDto, reporterId });
        const savedReport = await this.repository.save(report);

        return this.getById((savedReport as any).id);
    }

    async findAll(): Promise<imports.GetListDto[]> {
        const reports = await this.repository.find({
            relations: ['device', 'app', 'user'],
        });

        return Promise.all(
            reports.map(async (report) => {
                const device = await report.device;
                const software = await report.app;
                const user = await report.user;

                return transformToInstance(imports.GetListDto, {
                    ...report,
                    deviceName: device?.name,
                    softwareName: software?.name,
                    reporterName: user?.name,
                });
            }),
        );
    }

    async getPaginated(input: DeviceReportPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const { page, limit, sortBy, sortOrder, deviceId, reporterId, status, appId } = input;
        const skip = page * limit;

        const query = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.device', 'device')
            .leftJoinAndSelect('report.app', 'software')
            .leftJoinAndSelect('report.user', 'user');

        // Apply filters
        if (deviceId) {
            query.andWhere('report.deviceId = :deviceId', { deviceId });
        }

        if (reporterId) {
            query.andWhere('report.reporterId = :reporterId', { reporterId });
        }

        if (status) {
            query.andWhere('report.status = :status', { status });
        }

        if (appId) {
            query.andWhere('report.appId = :appId', { appId });
        }

        query.skip(skip).take(limit);

        if (sortBy && sortOrder) {
            query.orderBy(`report.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
        } else {
            query.orderBy('report.created_at', 'DESC');
        }

        const [reports, total] = await query.getManyAndCount();

        const items = await Promise.all(
            reports.map(async (report) => {
                const device = await report.device;
                const software = await report.app;
                const user = await report.user;

                return transformToInstance(imports.GetListDto, {
                    ...report,
                    deviceName: device?.name,
                    softwareName: software?.name,
                    reporterName: user?.name,
                });
            }),
        );

        return { items, total };
    }

    async getById(id: UUID): Promise<imports.GetDto> {
        const report = await this.repository.findOne({
            where: { id },
            relations: ['device', 'app', 'user'],
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        const device = await report.device;
        const software = await report.app;
        const user = await report.user;

        return transformToInstance(imports.GetDto, {
            ...report,
            deviceName: device?.name,
            softwareName: software?.name,
            reporterName: user?.name,
        });
    }

    async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
        const report = await this.repository.findOneBy({ id });
        if (!report) {
            throw new NotFoundException('Report not found');
        }

        // Validate device if being updated
        if (updateDto.deviceId && updateDto.deviceId !== report.deviceId) {
            const device = await this.deviceRepository.findOneBy({ id: updateDto.deviceId });
            if (!device) {
                throw new NotFoundException('Device not found');
            }
        }

        // Validate software if being updated
        if (updateDto.appId && updateDto.appId !== report.appId) {
            const software = await this.softwareRepository.findOneBy({ id: updateDto.appId });
            if (!software) {
                throw new NotFoundException('Software not found');
            }
        }

        Object.assign(report, updateDto);
        await this.repository.save(report);

        return this.getById(id);
    }

    async delete(ids: string): Promise<{ deletedCount: number }> {
        const idsArray = ids.split(',').map((id) => id.trim());
        const result = await this.repository.delete(idsArray);
        return { deletedCount: result.affected || 0 };
    }

    // Get reports for a specific user (student side)
    async getMyReports(userId: UUID, input: DeviceReportPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const modifiedInput = { ...input, reporterId: userId };
        return this.getPaginated(modifiedInput);
    }

    // Get reports for a specific device
    async getDeviceReports(deviceId: UUID, input: DeviceReportPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const modifiedInput = { ...input, deviceId };
        return this.getPaginated(modifiedInput);
    }
} 