import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSpecification } from 'src/database/devices/device-specification.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { DEVICES_CONFIG } from '../data/devices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviceSeeder {
	constructor(
		@InjectRepository(Device) private deviceRepo: Repository<Device>,
		@InjectRepository(DeviceSpecification) private deviceSpecRepo: Repository<DeviceSpecification>,
		@InjectRepository(Lab) private labRepo: Repository<Lab>,
		@InjectRepository(User) private userRepo: Repository<User>,
		private configService: ConfigService,
	) {}

	public async seed() {
		for (const deviceConfig of DEVICES_CONFIG) {
			// Check if device already exists
			const existingDevice = await this.deviceRepo.findOneBy({ IPAddress: deviceConfig.IPAddress });

			if (existingDevice) {
				console.log(`Device ${deviceConfig.IPAddress} already exists, skipping creation`);
				continue;
			}

			// Find the lab
			const lab = await this.labRepo.findOneBy({ name: deviceConfig.labName });
			if (!lab) {
				console.warn(`Lab ${deviceConfig.labName} not found. Skipping device ${deviceConfig.IPAddress}`);
				continue;
			}

			// Find the assistant user
			const assistant = await this.userRepo.findOneBy({ username: deviceConfig.assistantUsername });
			if (!assistant) {
				console.warn(`Assistant ${deviceConfig.assistantUsername} not found. Skipping device ${deviceConfig.IPAddress}`);
				continue;
			}

			// Create the device
			const device = this.deviceRepo.create({
				IPAddress: deviceConfig.IPAddress,
				name: deviceConfig.name,
				labId: lab.id,
				assisstantId: assistant.id,
				hasIssue: deviceConfig.hasIssue || false,
			});

			const savedDevice = await this.deviceRepo.save(device);

			// Create device specifications
			if (deviceConfig.specifications && deviceConfig.specifications.length > 0) {
				const specifications = deviceConfig.specifications.map((spec) => {
					return this.deviceSpecRepo.create({
						category: spec.category,
						value: spec.value,
						deviceId: savedDevice.id,
					});
				});

				await this.deviceSpecRepo.save(specifications);
			}

			console.log(`Created device: ${deviceConfig.IPAddress} in ${deviceConfig.labName} lab with ${deviceConfig.specifications.length} specifications`);
		}

		console.log('Device seeding completed');
	}
}
