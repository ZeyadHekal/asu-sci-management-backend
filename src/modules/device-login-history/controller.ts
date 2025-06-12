import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { DeviceLoginHistoryService } from './service';
import { CreateLoginHistoryDto, LoginHistoryDto, LoginHistoryPaginationInput } from './dtos';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';

@ApiTags('device-login-history')
@Controller('device-login-history')
export class DeviceLoginHistoryController {
    constructor(private readonly deviceLoginHistoryService: DeviceLoginHistoryService) { }

    @Post()
    @ApiOperation({ summary: 'Create login history record', description: 'Create a new device login history record' })
    @ApiResponse({ type: LoginHistoryDto, status: 201, description: 'Login history record created successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @ApiResponse({ status: 404, description: 'Not Found - Device or User does not exist' })
    async createLoginRecord(@Body() createDto: CreateLoginHistoryDto): Promise<LoginHistoryDto> {
        return this.deviceLoginHistoryService.createLoginRecord(createDto);
    }

    @Get('device/:deviceId')
    @ApiOperation({ summary: 'Get device login history', description: 'Retrieve login history for a specific device' })
    @ApiParam({ name: 'deviceId', description: 'Device ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Device login history retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
    async getDeviceLoginHistory(
        @Param('deviceId') deviceId: UUID,
        @Query() pagination: LoginHistoryPaginationInput
    ): Promise<IPaginationOutput<LoginHistoryDto>> {
        return this.deviceLoginHistoryService.findByDeviceId(deviceId, pagination);
    }

    @Get('device/:deviceId/stats')
    @ApiOperation({ summary: 'Get device login statistics', description: 'Get login statistics for a specific device' })
    @ApiParam({ name: 'deviceId', description: 'Device ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Device login statistics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Not Found - Device does not exist' })
    async getDeviceLoginStats(
        @Param('deviceId') deviceId: UUID,
        @Query('days') days: number = 30
    ): Promise<any> {
        return this.deviceLoginHistoryService.getLoginStatsByDevice(deviceId, days);
    }
} 