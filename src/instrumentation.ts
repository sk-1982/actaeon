export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		if (['true', 'yes', '1'].includes(process.env.AUTOMIGRATE?.toLowerCase()!)) {
			const url = new URL(process.env.DATABASE_URL!);
			url.searchParams.set('multipleStatements', 'true');
			process.env.DATABASE_URL = url.toString();
			// using require here increases build times to like 10 minutes for some reason
			const DBMigrate = await eval('imp' + 'ort("db-migrate")');
			const dbmigrate = DBMigrate.getInstance(true);
			await dbmigrate.up();

			const { createActaeonTeamsFromExistingTeams } = await import('./data/team');
			const { createActaeonFriendsFromExistingFriends } = await import('./data/friend');

			await Promise.all([
				createActaeonTeamsFromExistingTeams().catch(console.error),
				createActaeonFriendsFromExistingFriends().catch(console.error)
			]);
		}
	} else if (process.env.NEXT_RUNTIME === 'edge') {
		(globalThis as any).bcrypt = {};
		(globalThis as any).mysql2 = {};
	}
}
