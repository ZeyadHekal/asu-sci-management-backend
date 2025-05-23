import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as imports from './imports';
import { Device } from 'src/database/devices/device.entity';
import { User } from 'src/database/users/user.entity';
import { DeviceReport } from 'src/database/devices/devices_reports.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { MaintenanceHistoryPaginationInput } from './dtos';
import { UUID } from 'crypto';

@Injectable()
export class MaintenanceHistoryService {
    constructor(
        @InjectRepository(imports.Entity) private readonly repository: Repository<imports.Entity>,
        @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(DeviceReport) private readonly reportRepository: Repository<DeviceReport>,
    ) { }

    async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
        const maintenance = this.repository.create(createDto);
        const savedMaintenance = await this.repository.save(maintenance);
        return this.getById((savedMaintenance as any).id);
    }

    async findAll(): Promise<imports.GetListDto[]> {
        const maintenances = await this.repository.find({
            relations: ['device', 'technician', 'relatedReport'],
        });

        return Promise.all(
            maintenances.map(async (maintenance) => {
                const device = await maintenance.device;
                const technician = await maintenance.technician;
                const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

                return transformToInstance(imports.GetListDto, {
                    ...maintenance,
                    deviceName: device?.name,
                    technicianName: technician?.name,
                    relatedReportDescription: relatedReport?.description,
                });
            }),
        );
    }

    async getPaginated(input: MaintenanceHistoryPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const { page, limit, sortBy, sortOrder, deviceId, technicianId, status, maintenanceType, relatedReportId } = input;
        const skip = page * limit;

        const query = this.repository
            .createQueryBuilder('maintenance')
            .leftJoinAndSelect('maintenance.device', 'device')
            .leftJoinAndSelect('maintenance.technician', 'technician')
            .leftJoinAndSelect('maintenance.relatedReport', 'relatedReport');

        if (deviceId) query.andWhere('maintenance.deviceId = :deviceId', { deviceId });
        if (technicianId) query.andWhere('maintenance.technicianId = :technicianId', { technicianId });
        if (status) query.andWhere('maintenance.status = :status', { status });
        if (maintenanceType) query.andWhere('maintenance.maintenanceType = :maintenanceType', { maintenanceType });
        if (relatedReportId) query.andWhere('maintenance.relatedReportId = :relatedReportId', { relatedReportId });

        query.skip(skip).take(limit);

        if (sortBy && sortOrder) {
            query.orderBy(`maintenance.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
        } else {
            query.orderBy('maintenance.created_at', 'DESC');
        }

        const [maintenances, total] = await query.getManyAndCount();

        const items = await Promise.all(
            maintenances.map(async (maintenance) => {
                const device = await maintenance.device;
                const technician = await maintenance.technician;
                const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

                return transformToInstance(imports.GetListDto, {
                    ...maintenance,
                    deviceName: device?.name,
                    technicianName: technician?.name,
                    relatedReportDescription: relatedReport?.description,
                });
            }),
        );

        return { items, total };
    }

    async getById(id: UUID): Promise<imports.GetDto> {
        const maintenance = await this.repository.findOne({
            where: { id },
            relations: ['device', 'technician', 'relatedReport'],
        });

        if (!maintenance) {
            throw new NotFoundException('Maintenance history not found');
        }

        const device = await maintenance.device;
        const technician = await maintenance.technician;
        const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

        return transformToInstance(imports.GetDto, {
            ...maintenance,
            deviceName: device?.name,
            technicianName: technician?.name,
            relatedReportDescription: relatedReport?.description,
        });
    }

    async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
        const maintenance = await this.repository.findOneBy({ id });
        if (!maintenance) {
            throw new NotFoundException('Maintenance history not found');
        }

        Object.assign(maintenance, updateDto);
        await this.repository.save(maintenance);

        return this.getById(id);
    }

    async delete(ids: string): Promise<{ deletedCount: number }> {
        const idsArray = ids.split(',').map((id) => id.trim());
        const result = await this.repository.delete(idsArray);
        return { deletedCount: result.affected || 0 };
    }

    // Get maintenance history for a specific device
    async getDeviceMaintenanceHistory(deviceId: UUID, input: MaintenanceHistoryPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const modifiedInput = { ...input, deviceId };
        return this.getPaginated(modifiedInput);
    }
} 