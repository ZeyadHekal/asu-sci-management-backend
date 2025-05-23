import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Software } from 'src/database/softwares/software.entity';
import { SOFTWARES_CONFIG } from '../data/softwares';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SoftwareSeeder {
    constructor(
        @InjectRepository(Software) private softwareRepo: Repository<Software>,
        private configService: ConfigService,
    ) { }

    public async seed() {
        for (const softwareConfig of SOFTWARES_CONFIG) {
            // Check if software already exists
            const existingSoftware = await this.softwareRepo.findOneBy({
                name: softwareConfig.name
            });

            if (existingSoftware) {
                console.log(`Software ${softwareConfig.name} already exists, skipping creation`);
                continue;
            }

            // Create the software
            const software = this.softwareRepo.create({
                name: softwareConfig.name,
                requiredMemory: softwareConfig.requiredMemory,
                requiredStorage: softwareConfig.requiredStorage,
            });

            await this.softwareRepo.save(software);
            console.log(`Created software: ${softwareConfig.name}`);
        }

        console.log('Software seeding completed');
    }
} 