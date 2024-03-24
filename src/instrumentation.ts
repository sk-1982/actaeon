export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		if (['true', 'yes', '1'].includes(process.env.AUTOMIGRATE?.toLowerCase()!)) {
			const DBMigrate = require('db-migrate');
			const dbmigrate = DBMigrate.getInstance(true);
			await dbmigrate.up();
		}
	}
}
