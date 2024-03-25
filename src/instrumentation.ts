export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		if (['true', 'yes', '1'].includes(process.env.AUTOMIGRATE?.toLowerCase()!)) {
			// using require here increases build times to like 10 minutes for some reason
			const DBMigrate = await eval('imp' + 'ort("db-migrate")');
			const dbmigrate = DBMigrate.getInstance(true);
			await dbmigrate.up();
		}
	}
}
