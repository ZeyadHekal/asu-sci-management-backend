import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
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

    // Helper method to update related report status
    private async updateRelatedReportStatus(maintenanceRecord: imports.Entity): Promise<void> {
        if (maintenanceRecord.relatedReportId) {
            const report = await this.reportRepository.findOneBy({ id: maintenanceRecord.relatedReportId });
            if (report) {
                let shouldUpdate = false;

                // Update report status based on maintenance status
                switch (maintenanceRecord.status) {
                    case 'COMPLETED':
                        if (report.status !== 'RESOLVED') {
                            report.status = 'RESOLVED';
                            // Update fixMessage with the latest resolution notes
                            if (maintenanceRecord.resolutionNotes) {
                                report.fixMessage = maintenanceRecord.resolutionNotes;
                            }
                            shouldUpdate = true;
                        }
                        break;
                    case 'IN_PROGRESS':
                        if (report.status === 'PENDING_REVIEW') {
                            report.status = 'IN_PROGRESS';
                            shouldUpdate = true;
                        }
                        break;
                    case 'FAILED':
                    case 'CANCELLED':
                        // Don't automatically change status for failed/cancelled maintenance
                        break;
                }

                if (shouldUpdate) {
                    await this.reportRepository.save(report);
                }
            }
        }
    }

    async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
        const maintenance = this.repository.create(createDto);
        const savedMaintenance = await this.repository.save(maintenance);

        // Update related report status if applicable
        await this.updateRelatedReportStatus(savedMaintenance);

        return this.getById((savedMaintenance as any).id);
    }

    async findAll(): Promise<imports.GetListDto[]> {
        const maintenances = await this.repository.find({
            relations: ['device', 'relatedReport'],
        });

        return Promise.all(
            maintenances.map(async (maintenance) => {
                const device = await maintenance.device;
                const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

                return transformToInstance(imports.GetListDto, {
                    ...maintenance,
                    deviceName: device?.name,
                    relatedReportDescription: relatedReport?.description,
                });
            }),
        );
    }

    async getPaginated(input: MaintenanceHistoryPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const { page, limit, sortBy, sortOrder, deviceId, labId, status, maintenanceType, relatedReportId, search, dateFrom, dateTo } = input;
        const skip = page * limit;

        const query = this.repository
            .createQueryBuilder('maintenance')
            .leftJoinAndSelect('maintenance.device', 'device')
            .leftJoinAndSelect('maintenance.relatedReport', 'relatedReport');

        if (deviceId) query.andWhere('maintenance.deviceId = :deviceId', { deviceId });
        if (labId) query.andWhere('device.labId = :labId', { labId });
        if (status) query.andWhere('maintenance.status = :status', { status });
        if (maintenanceType) query.andWhere('maintenance.maintenanceType = :maintenanceType', { maintenanceType });
        if (relatedReportId) query.andWhere('maintenance.relatedReportId = :relatedReportId', { relatedReportId });

        // Apply search across device names, descriptions, and personnel names
        if (search) {
            query.andWhere(
                '(LOWER(device.name) LIKE LOWER(:search) OR LOWER(maintenance.description) LIKE LOWER(:search) OR LOWER(maintenance.resolutionNotes) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        // Apply date range filter
        if (dateFrom) {
            query.andWhere('DATE(maintenance.created_at) >= :dateFrom', { dateFrom });
        }

        if (dateTo) {
            query.andWhere('DATE(maintenance.created_at) <= :dateTo', { dateTo });
        }

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
                const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

                return transformToInstance(imports.GetListDto, {
                    ...maintenance,
                    deviceName: device?.name,
                    relatedReportDescription: relatedReport?.description,
                });
            }),
        );

        return { items, total };
    }

    async exportMaintenanceXlsx(input: MaintenanceHistoryPaginationInput, res: any): Promise<void> {
        // Get all records without pagination for export
        const exportInput = { ...input, page: 0, limit: 999999 };
        const { items } = await this.getPaginated(exportInput);

        // Create data for Excel export
        const data = items.map((maintenance: any) => ({
            'Date': new Date(maintenance.created_at).toLocaleString(),
            'Device': maintenance.deviceName || `Device ${maintenance.deviceId}`,
            'Type': maintenance.maintenanceType,
            'Status': maintenance.status,
            'Description': maintenance.description,
            'Involved Personnel': maintenance.involvedPersonnel?.join(', ') || 'No personnel listed',
            'Resolution Notes': maintenance.resolutionNotes || 'N/A'
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(data[0] || {}).map(key => {
            const maxLength = Math.max(
                key.length,
                ...data.map(row => String(row[key as keyof typeof row] || '').length)
            );
            return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance History');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="maintenance-history.xlsx"');
        res.send(excelBuffer);
    }

    async getById(id: UUID): Promise<imports.GetDto> {
        const maintenance = await this.repository.findOne({
            where: { id },
            relations: ['device', 'relatedReport'],
        });

        if (!maintenance) {
            throw new NotFoundException('Maintenance history not found');
        }

        const device = await maintenance.device;
        const relatedReport = maintenance.relatedReportId ? await maintenance.relatedReport : null;

        return transformToInstance(imports.GetDto, {
            ...maintenance,
            deviceName: device?.name,
            relatedReportDescription: relatedReport?.description,
        });
    }

    async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
        const maintenance = await this.repository.findOneBy({ id });
        if (!maintenance) {
            throw new NotFoundException('Maintenance history not found');
        }

        Object.assign(maintenance, updateDto);
        const updatedMaintenance = await this.repository.save(maintenance);

        // Update related report status if applicable
        await this.updateRelatedReportStatus(updatedMaintenance);

        return this.getById(id);
    }

    async delete(id: UUID): Promise<{ affected: number }> {
        const maintenance = await this.repository.findOneBy({ id });
        if (!maintenance) {
            throw new NotFoundException('Maintenance history not found');
        }

        const result = await this.repository.delete(id);
        return { affected: result.affected || 0 };
    }

    // Get maintenance history for a specific device
    async getDeviceMaintenanceHistory(deviceId: UUID, input: MaintenanceHistoryPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const modifiedInput = { ...input, deviceId };
        return this.getPaginated(modifiedInput);
    }
} 