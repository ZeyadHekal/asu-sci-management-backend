import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as XLSX from 'xlsx';
import * as imports from './imports';
import { Device } from 'src/database/devices/device.entity';
import { Software } from 'src/database/softwares/software.entity';
import { User } from 'src/database/users/user.entity';
import { DeviceMaintenanceHistory } from 'src/database/devices/device-maintenance-history.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { DeviceReportPaginationInput, ReportStatus, ReportMaintenanceHistoryDto } from './dtos';
import { UUID } from 'crypto';
import { WebsocketService } from '../../websockets/websocket.service';
import { WSEventType, DeviceReportCreatedData, DeviceReportUpdatedData, DeviceReportStatusChangedData } from '../../websockets/websocket.interfaces';

@Injectable()
export class DeviceReportService {
    constructor(
        @InjectRepository(imports.Entity) private readonly repository: Repository<imports.Entity>,
        @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
        @InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(DeviceMaintenanceHistory) private readonly maintenanceHistoryRepository: Repository<DeviceMaintenanceHistory>,
        @InjectRepository(DeviceSoftware) private readonly deviceSoftwareRepository: Repository<DeviceSoftware>,
        private readonly websocketService: WebsocketService,
    ) { }

    // Helper method to handle status changes and update software availability
    private async handleStatusChange(report: imports.Entity, oldStatus: string, newStatus: string): Promise<void> {
        // Only handle software issue reports (when appId exists)
        if (!report.appId) return;

        if (newStatus === ReportStatus.CONFIRMED) {
            // Mark the software as not available on this device
            await this.deviceSoftwareRepository.update(
                { deviceId: report.deviceId, softwareId: report.appId },
                { status: 'not available', hasIssue: true }
            );
        } else if (newStatus === ReportStatus.REJECTED && oldStatus === ReportStatus.CONFIRMED) {
            // If rejecting a previously confirmed report, restore software availability
            await this.deviceSoftwareRepository.update(
                { deviceId: report.deviceId, softwareId: report.appId },
                { status: 'available', hasIssue: false }
            );
        }
    }

    // Helper method to get maintenance history for a report
    private async getReportMaintenanceHistory(reportId: UUID): Promise<ReportMaintenanceHistoryDto[]> {
        const maintenanceRecords = await this.maintenanceHistoryRepository.find({
            where: { relatedReportId: reportId },
            order: { created_at: 'ASC' }
        });

        return maintenanceRecords.map(record => transformToInstance(ReportMaintenanceHistoryDto, {
            id: record.id,
            maintenanceType: record.maintenanceType,
            status: record.status,
            description: record.description,
            resolutionNotes: record.resolutionNotes,
            involvedPersonnel: record.involvedPersonnel,
            completedAt: record.completedAt,
            created_at: record.created_at,
            updated_at: record.updated_at,
        }));
    }

    // Helper method to update report status based on latest maintenance record
    private async updateReportStatusFromMaintenance(reportId: UUID): Promise<void> {
        const latestMaintenanceRecord = await this.maintenanceHistoryRepository.findOne({
            where: { relatedReportId: reportId },
            order: { created_at: 'DESC' }
        });

        if (latestMaintenanceRecord) {
            const report = await this.repository.findOneBy({ id: reportId });
            if (report) {
                let newStatus = report.status;

                // Update report status based on maintenance status
                switch (latestMaintenanceRecord.status) {
                    case 'COMPLETED':
                        newStatus = ReportStatus.RESOLVED;
                        // Update fixMessage with the latest resolution notes
                        if (latestMaintenanceRecord.resolutionNotes) {
                            report.fixMessage = latestMaintenanceRecord.resolutionNotes;
                        }
                        break;
                    case 'IN_PROGRESS':
                        if (report.status === ReportStatus.PENDING_REVIEW) {
                            newStatus = ReportStatus.IN_PROGRESS;
                        }
                        break;
                    case 'FAILED':
                    case 'CANCELLED':
                        // Don't automatically change status for failed/cancelled maintenance
                        break;
                }

                if (newStatus !== report.status) {
                    report.status = newStatus;
                    await this.repository.save(report);
                }
            }
        }
    }

    async create(createDto: imports.CreateDto, userId?: UUID): Promise<imports.GetDto> {
        // Validate device exists
        const device = await this.deviceRepository.findOneBy({ id: createDto.deviceId });
        if (!device) {
            throw new NotFoundException('Device not found');
        }

        // Validate software exists if appId is provided
        if (createDto.appId) {
            const software = await this.softwareRepository.findOneBy({ id: createDto.appId });
            if (!software) {
                throw new NotFoundException('Software not found');
            }
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

        // Get complete report data for WebSocket emission
        const completeReport = await this.getById((savedReport as any).id);

        // Emit WebSocket event for new report creation
        const deviceReportCreatedData: DeviceReportCreatedData = {
            reportId: completeReport.id,
            deviceId: completeReport.deviceId,
            deviceName: completeReport.deviceName,
            reporterId: completeReport.reporterId,
            reporterName: completeReport.reporterName,
            description: completeReport.description,
            status: completeReport.status,
        };

        // Emit to all connected clients
        this.websocketService.broadcast(WSEventType.DEVICE_REPORT_CREATED, deviceReportCreatedData);

        return completeReport;
    }

    async findAll(): Promise<imports.GetListDto[]> {
        const reports = await this.repository.find({
            relations: ['device', 'app', 'user'],
        });

        return Promise.all(
            reports.map(async (report) => {
                const device = await report.device;
                const software = report.app ? await report.app : null;
                const user = await report.user;

                // Get maintenance history for this report
                const resolutionUpdates = await this.getReportMaintenanceHistory(report.id);

                return transformToInstance(imports.GetListDto, {
                    ...report,
                    deviceName: device?.name,
                    softwareName: software?.name,
                    reporterName: user?.name,
                    resolutionUpdates,
                });
            }),
        );
    }

    async getPaginated(input: DeviceReportPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const { page, limit, sortBy, sortOrder, deviceId, labId, reporterId, status, appId, search, dateFrom, dateTo } = input;
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

        if (labId) {
            query.andWhere('device.labId = :labId', { labId });
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

        // Apply search across device names, descriptions, and reporter names
        if (search) {
            query.andWhere(
                '(LOWER(device.name) LIKE LOWER(:search) OR LOWER(report.description) LIKE LOWER(:search) OR LOWER(user.name) LIKE LOWER(:search) OR LOWER(software.name) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        // Apply date range filter
        if (dateFrom) {
            query.andWhere('DATE(report.created_at) >= :dateFrom', { dateFrom });
        }

        if (dateTo) {
            query.andWhere('DATE(report.created_at) <= :dateTo', { dateTo });
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
                const software = report.app ? await report.app : null;
                const user = await report.user;

                // Get maintenance history for this report
                const resolutionUpdates = await this.getReportMaintenanceHistory(report.id);

                return transformToInstance(imports.GetListDto, {
                    ...report,
                    deviceName: device?.name,
                    softwareName: software?.name,
                    reporterName: user?.name,
                    resolutionUpdates,
                });
            }),
        );

        return { items, total };
    }

    async exportReportsXlsx(input: DeviceReportPaginationInput, res: any): Promise<void> {
        // Get all records without pagination for export
        const exportInput = { ...input, page: 0, limit: 999999 };
        const { items } = await this.getPaginated(exportInput);

        // Create data for Excel export
        const data = items.map((report: any) => ({
            'Report Date': new Date(report.created_at).toLocaleString(),
            'Device': report.deviceName || `Device ${report.deviceId}`,
            'Reported By': report.reporterName || 'Unknown',
            'Status': report.status,
            'Problem Description': report.description,
            'Updates Count': report.resolutionUpdates?.length || 0,
            'Latest Update Status': report.resolutionUpdates?.length > 0 ? report.resolutionUpdates[report.resolutionUpdates.length - 1]?.status || 'Unknown' : 'N/A'
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
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Device Reports');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="device-reports.xlsx"');
        res.send(excelBuffer);
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
        const software = report.app ? await report.app : null;
        const user = await report.user;

        // Get maintenance history for this report
        const resolutionUpdates = await this.getReportMaintenanceHistory(id);

        return transformToInstance(imports.GetDto, {
            ...report,
            deviceName: device?.name,
            softwareName: software?.name,
            reporterName: user?.name,
            resolutionUpdates,
        });
    }

    async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
        const report = await this.repository.findOneBy({ id });
        if (!report) {
            throw new NotFoundException('Report not found');
        }

        // Store old status for WebSocket event
        const oldStatus = report.status;

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

        // Handle software availability when report is confirmed/rejected
        if (updateDto.status && updateDto.status !== oldStatus) {
            await this.handleStatusChange(report, oldStatus, updateDto.status);
        }

        Object.assign(report, updateDto);
        await this.repository.save(report);

        // Get complete updated report data
        const updatedReport = await this.getById(id);

        // Emit WebSocket event for report update
        const deviceReportUpdatedData: DeviceReportUpdatedData = {
            reportId: updatedReport.id,
            deviceId: updatedReport.deviceId,
            deviceName: updatedReport.deviceName,
            oldStatus: oldStatus,
            newStatus: updatedReport.status,
            description: updatedReport.description,
        };

        this.websocketService.broadcast(WSEventType.DEVICE_REPORT_UPDATED, deviceReportUpdatedData);

        // If status changed, emit a specific status change event
        if (oldStatus !== updatedReport.status) {
            const deviceReportStatusChangedData: DeviceReportStatusChangedData = {
                reportId: updatedReport.id,
                oldStatus: oldStatus,
                newStatus: updatedReport.status,
                deviceId: updatedReport.deviceId,
                deviceName: updatedReport.deviceName,
                fixMessage: updatedReport.fixMessage,
            };

            this.websocketService.broadcast(WSEventType.DEVICE_REPORT_STATUS_CHANGED, deviceReportStatusChangedData);
        }

        return updatedReport;
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

    // Get count of unresolved reports for a specific device
    async getUnresolvedReportsCount(deviceId: UUID): Promise<{ count: number }> {
        const count = await this.repository.count({
            where: {
                deviceId,
                status: In(['PENDING_REVIEW', 'IN_PROGRESS'])
            }
        });
        return { count };
    }

    // Get total count of unresolved reports across all devices
    async getTotalUnresolvedReportsCount(): Promise<{ count: number }> {
        const count = await this.repository.count({
            where: {
                status: In(['PENDING_REVIEW', 'IN_PROGRESS'])
            }
        });
        return { count };
    }

    // Get reports for devices assigned to specific lab assistant  
    async getMyAssignedReports(assistantId: UUID, input: DeviceReportPaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
        const { page, limit, sortBy, sortOrder, status, appId, search } = input;
        const skip = page * limit;

        const query = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.device', 'device')
            .leftJoinAndSelect('report.app', 'software')
            .leftJoinAndSelect('report.user', 'user')
            .where('device.assisstantId = :assistantId', { assistantId });

        // Apply additional filters
        if (status) {
            query.andWhere('report.status = :status', { status });
        }

        if (appId) {
            query.andWhere('report.appId = :appId', { appId });
        }

        // Apply search across device names, descriptions, and reporter names
        if (search) {
            query.andWhere(
                '(LOWER(device.name) LIKE LOWER(:search) OR LOWER(report.description) LIKE LOWER(:search) OR LOWER(user.name) LIKE LOWER(:search) OR LOWER(software.name) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
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
                const software = report.app ? await report.app : null;
                const user = await report.user;

                // Get maintenance history for this report
                const resolutionUpdates = await this.getReportMaintenanceHistory(report.id);

                return transformToInstance(imports.GetListDto, {
                    ...report,
                    deviceName: device?.name,
                    softwareName: software?.name,
                    reporterName: user?.name,
                    resolutionUpdates,
                });
            }),
        );

        return { items, total };
    }

    // Get count of unresolved reports for devices assigned to specific lab assistant
    async getMyUnresolvedReportsCount(assistantId: UUID): Promise<{ count: number }> {
        const count = await this.repository.count({
            where: {
                status: In(['PENDING_REVIEW', 'IN_PROGRESS']),
                device: {
                    assisstantId: assistantId
                }
            },
            relations: ['device']
        });
        return { count };
    }
} 