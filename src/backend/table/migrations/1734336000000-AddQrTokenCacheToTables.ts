import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration to add QR token cache fields to tables
 * Adds qrToken and qrTokenGeneratedAt columns for performance optimization
 */
export class AddQrTokenCacheToTables1734336000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add qrToken column
		await queryRunner.addColumn(
			'tables',
			new TableColumn({
				name: 'qrToken',
				type: 'text',
				isNullable: true,
				comment: 'Cached QR token (signed HMAC-SHA256)',
			}),
		);

		// Add qrTokenGeneratedAt column
		await queryRunner.addColumn(
			'tables',
			new TableColumn({
				name: 'qrTokenGeneratedAt',
				type: 'timestamp',
				isNullable: true,
				comment: 'Timestamp when QR token was last generated',
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Remove columns in reverse order
		await queryRunner.dropColumn('tables', 'qrTokenGeneratedAt');
		await queryRunner.dropColumn('tables', 'qrToken');
	}
}
