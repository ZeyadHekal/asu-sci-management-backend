import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class EnhanceEventsForExamSystem1703000000000 implements MigrationInterface {
	name = 'EnhanceEventsForExamSystem1703000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add new columns to events table
		await queryRunner.addColumns('events', [
			new TableColumn({
				name: 'autoStart',
				type: 'boolean',
				default: false,
				isNullable: false,
			}),
			new TableColumn({
				name: 'examModeStartMinutes',
				type: 'int',
				default: 30,
				isNullable: false,
			}),
			new TableColumn({
				name: 'description',
				type: 'text',
				isNullable: true,
			}),
		]);

		// Modify existing examFiles column to be nullable
		await queryRunner.changeColumn(
			'events',
			'examFiles',
			new TableColumn({
				name: 'examFiles',
				type: 'text',
				isNullable: true,
			}),
		);

		// Add new columns to event_schedules table
		await queryRunner.addColumns('event_schedules', [
			new TableColumn({
				name: 'status',
				type: 'enum',
				enum: ['scheduled', 'exam_mode_active', 'started', 'ended', 'cancelled'],
				default: "'scheduled'",
				isNullable: false,
			}),
			new TableColumn({
				name: 'actualStartTime',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'actualEndTime',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'examModeStartTime',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'maxStudents',
				type: 'int',
				default: 0,
				isNullable: false,
			}),
			new TableColumn({
				name: 'enrolledStudents',
				type: 'int',
				default: 0,
				isNullable: false,
			}),
			new TableColumn({
				name: 'exam_group_id',
				type: 'uuid',
				isNullable: true,
			}),
		]);

		// Modify existing examFiles column in event_schedules to be nullable
		await queryRunner.changeColumn(
			'event_schedules',
			'examFiles',
			new TableColumn({
				name: 'examFiles',
				type: 'text',
				isNullable: true,
			}),
		);

		// Rename assisstant_id to assistant_id for consistency
		await queryRunner.renameColumn('event_schedules', 'assisstant_id', 'assistant_id');

		// Create exam_groups table
		await queryRunner.createTable(
			new Table({
				name: 'exam_groups',
				columns: [
					{
						name: 'id',
						type: 'uuid',
						isPrimary: true,
						generationStrategy: 'uuid',
						default: 'uuid_generate_v4()',
					},
					{
						name: 'event_id',
						type: 'uuid',
						isNullable: false,
					},
					{
						name: 'course_group_id',
						type: 'uuid',
						isNullable: false,
					},
					{
						name: 'groupNumber',
						type: 'int',
						isNullable: false,
					},
					{
						name: 'expectedStudentCount',
						type: 'int',
						isNullable: false,
					},
					{
						name: 'actualStudentCount',
						type: 'int',
						default: 0,
						isNullable: false,
					},
					{
						name: 'notes',
						type: 'text',
						isNullable: true,
					},
					{
						name: 'created_at',
						type: 'timestamp',
						default: 'CURRENT_TIMESTAMP',
						isNullable: false,
					},
					{
						name: 'updated_at',
						type: 'timestamp',
						default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
						isNullable: false,
					},
				],
				indices: [
					{
						name: 'idx_exam_groups_event',
						columnNames: ['event_id'],
					},
					{
						name: 'idx_exam_groups_course_group',
						columnNames: ['course_group_id'],
					},
				],
				uniques: [
					{
						name: 'unique_exam_group_event_course',
						columnNames: ['event_id', 'course_group_id'],
					},
				],
			}),
			true,
		);

		// Add foreign keys for exam_groups table
		await queryRunner.createForeignKey(
			'exam_groups',
			new TableForeignKey({
				columnNames: ['event_id'],
				referencedTableName: 'events',
				referencedColumnNames: ['id'],
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			'exam_groups',
			new TableForeignKey({
				columnNames: ['course_group_id'],
				referencedTableName: 'course_groups',
				referencedColumnNames: ['id'],
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			}),
		);

		// Add foreign key for exam_group_id in event_schedules
		await queryRunner.createForeignKey(
			'event_schedules',
			new TableForeignKey({
				columnNames: ['exam_group_id'],
				referencedTableName: 'exam_groups',
				referencedColumnNames: ['id'],
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
			}),
		);

		// Add new columns to student_event_schedules table
		await queryRunner.addColumns('student_event_schedules', [
			new TableColumn({
				name: 'mark',
				type: 'float',
				isNullable: true,
			}),
			new TableColumn({
				name: 'submittedAt',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'isInExamMode',
				type: 'boolean',
				default: false,
				isNullable: false,
			}),
			new TableColumn({
				name: 'examModeEnteredAt',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'examStartedAt',
				type: 'timestamp',
				isNullable: true,
			}),
			new TableColumn({
				name: 'submittedFiles',
				type: 'text',
				isNullable: true,
			}),
			new TableColumn({
				name: 'assignedExamModelUrl',
				type: 'text',
				isNullable: true,
			}),
		]);

		// Modify existing columns in student_event_schedules to be nullable
		await queryRunner.changeColumn(
			'student_event_schedules',
			'hasAttended',
			new TableColumn({
				name: 'hasAttended',
				type: 'boolean',
				isNullable: true,
			}),
		);

		await queryRunner.changeColumn(
			'student_event_schedules',
			'examModel',
			new TableColumn({
				name: 'examModel',
				type: 'varchar',
				isNullable: true,
			}),
		);

		await queryRunner.changeColumn(
			'student_event_schedules',
			'seatNo',
			new TableColumn({
				name: 'seatNo',
				type: 'varchar',
				isNullable: true,
			}),
		);

		// Add exam models column to event_schedules table
		await queryRunner.addColumn('event_schedules', new TableColumn({
			name: 'examModels',
			type: 'text',
			isNullable: true,
		}));
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Remove foreign key for exam_group_id
		const eventSchedulesTable = await queryRunner.getTable('event_schedules');
		const examGroupForeignKey = eventSchedulesTable.foreignKeys.find((fk) => fk.columnNames.indexOf('exam_group_id') !== -1);
		if (examGroupForeignKey) {
			await queryRunner.dropForeignKey('event_schedules', examGroupForeignKey);
		}

		// Drop exam_groups table
		await queryRunner.dropTable('exam_groups');

		// Remove new columns from student_event_schedules
		await queryRunner.dropColumns('student_event_schedules', ['mark', 'submittedAt', 'isInExamMode', 'examModeEnteredAt', 'examStartedAt', 'submittedFiles', 'assignedExamModelUrl']);

		// Remove new columns from event_schedules
		await queryRunner.dropColumns('event_schedules', [
			'status',
			'actualStartTime',
			'actualEndTime',
			'examModeStartTime',
			'maxStudents',
			'enrolledStudents',
			'exam_group_id',
			'examModels',
		]);

		// Rename assistant_id back to assisstant_id
		await queryRunner.renameColumn('event_schedules', 'assistant_id', 'assisstant_id');

		// Remove new columns from events
		await queryRunner.dropColumns('events', ['autoStart', 'examModeStartMinutes', 'description']);

		// Revert examFiles column to non-nullable
		await queryRunner.changeColumn(
			'events',
			'examFiles',
			new TableColumn({
				name: 'examFiles',
				type: 'text',
				isNullable: false,
			}),
		);
	}
}
