import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeviceName1703000000001 implements MigrationInterface {
    name = 'AddDeviceName1703000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add name column to devices table
        await queryRunner.addColumn(
            'devices',
            new TableColumn({
                name: 'name',
                type: 'varchar',
                length: '255',
                isNullable: false,
                default: "'Unnamed Device'", // Temporary default for existing devices
            }),
        );

        // Remove the default value after adding the column
        await queryRunner.changeColumn(
            'devices',
            'name',
            new TableColumn({
                name: 'name',
                type: 'varchar',
                length: '255',
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove name column from devices table
        await queryRunner.dropColumn('devices', 'name');
    }
}
