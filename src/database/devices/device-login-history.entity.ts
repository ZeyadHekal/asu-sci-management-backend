import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Device } from './device.entity';
import { User } from '../users/user.entity';

export enum LoginStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    LOGOUT = 'LOGOUT',
}

@Entity('device_login_history')
export class DeviceLoginHistory extends ManagementEntity {
    @Column({ nullable: false, name: 'device_id' })
    @Expose()
    deviceId: UUID;

    @Column({ nullable: false, name: 'user_id' })
    @Expose()
    userId: UUID;

    @Column({ nullable: false })
    @Expose()
    ipAddress: string;

    @Column({
        type: 'enum',
        enum: LoginStatus,
        default: LoginStatus.SUCCESS,
    })
    @Expose()
    loginStatus: LoginStatus;

    @Column({ nullable: false })
    @Expose()
    loginTime: Date;

    @Column({ nullable: true })
    @Expose()
    logoutTime?: Date;

    @Column({ nullable: true })
    @Expose()
    sessionDuration?: number; // in minutes

    @Column({ nullable: true })
    @Expose()
    userAgent?: string;

    @Column({ nullable: true })
    @Expose()
    operatingSystem?: string;

    @Column({ nullable: true })
    @Expose()
    browser?: string;

    @Column({ type: 'text', nullable: true })
    @Expose()
    failureReason?: string;

    @ManyToOne(() => Device, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'device_id' })
    device: Promise<Device>;

    @ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Promise<User>;
} 