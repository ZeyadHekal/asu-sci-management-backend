import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { File } from '../entities/file.entity';

@Injectable()
export class FileRepository extends Repository<File> {
    constructor(private dataSource: DataSource) {
        super(File, dataSource.createEntityManager());
    }

    /**
     * Find file by its ID
     * @param id File ID
     * @returns File entity or null if not found
     */
    async findById(id: number): Promise<File | null> {
        return this.findOne({ where: { id } });
    }

    /**
     * Find file by its object name in storage
     * @param objectName Object name in storage
     * @returns File entity or null if not found
     */
    async findByObjectName(objectName: string): Promise<File | null> {
        return this.findOne({ where: { objectName } });
    }
} 