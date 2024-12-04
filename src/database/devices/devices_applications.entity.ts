import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, PrimaryColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';
import { Device } from './device.entity';
import { Application } from '../applications/application.entity';
import { DeviceReport } from './devices_reports.entity';

@Entity('device_applications')
export class DeviceApplications extends OmitType(ManagementEntity,['id']){
	@PrimaryColumn({name:'device_id'})
	@Expose()
	deviceId: UUID;

	@PrimaryColumn({name:'app_id'})
	@Expose()
	app_id: UUID;

	@Column()
	@Expose()
	hassIssue: boolean;

	@Column({name: 'device_report_id' })
	@Expose()
	deviceReportId: UUID;

	@ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_id' })
	device: Promise<Device>;

    @ManyToOne(() => Application, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'app_id' })
	app: Promise<Application>;

    @ManyToOne(() => DeviceReport, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'device_report_id' })
	report: Promise<DeviceReport>;
}
