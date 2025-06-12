import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { UUID } from 'crypto';
import { EventGroupService, EventGroupDto, EventGroupStudentDto } from './service';
import { MoveStudentBetweenGroupsDto } from '../events/dtos';

@ApiTags('event-groups')
@Controller('event-groups')
export class EventGroupController {
    constructor(private readonly eventGroupService: EventGroupService) { }

    @Get('event/:eventId')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get all event groups for a specific event' })
    @ApiParam({ name: 'eventId', description: 'Event ID' })
    @ApiResponse({
        status: 200,
        description: 'Event groups retrieved successfully',
        type: [EventGroupDto]
    })
    async getEventGroups(@Param('eventId') eventId: UUID): Promise<EventGroupDto[]> {
        return this.eventGroupService.getEventGroups(eventId);
    }

    @Get(':groupId/students')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get students in a specific event group' })
    @ApiParam({ name: 'groupId', description: 'Event Group ID' })
    @ApiResponse({
        status: 200,
        description: 'Event group students retrieved successfully',
        type: [EventGroupStudentDto]
    })
    async getEventGroupStudents(@Param('groupId') groupId: UUID): Promise<EventGroupStudentDto[]> {
        return this.eventGroupService.getEventGroupStudents(groupId);
    }

    @Post('move-student')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Move student between event groups' })
    @ApiResponse({
        status: 200,
        description: 'Student moved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    async moveStudentBetweenGroups(@Body() moveRequest: MoveStudentBetweenGroupsDto): Promise<{ success: boolean; message: string }> {
        return this.eventGroupService.moveStudentBetweenGroups(moveRequest);
    }

    @Post(':groupId/start-exam')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Start exam for a specific group (manual start)' })
    @ApiParam({ name: 'groupId', description: 'Event Group ID' })
    @ApiResponse({
        status: 200,
        description: 'Exam started successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    async startExamForGroup(@Param('groupId') groupId: UUID): Promise<{ success: boolean; message: string }> {
        return this.eventGroupService.startExamForGroup(groupId);
    }

    @Patch(':groupId/auto-start')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Update autoStart setting for a group' })
    @ApiParam({ name: 'groupId', description: 'Event Group ID' })
    @ApiResponse({
        status: 200,
        description: 'Auto-start setting updated successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    async updateAutoStart(
        @Param('groupId') groupId: UUID,
        @Body() body: { autoStart: boolean }
    ): Promise<{ success: boolean; message: string }> {
        return this.eventGroupService.updateAutoStart(groupId, body.autoStart);
    }
} 