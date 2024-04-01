export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		if (process.env.NODE_ENV === 'production') {
			const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

			if (!secret) {
				console.error('[FATAL] secret is required, please specify it by setting the NEXTAUTH_SECRET variable to a random string');
				process.exit(1);
			}

			if (/secret|password|random/i.test(secret)) {
				console.error('[FATAL] insecure secret detected, please set NEXTAUTH_SECRET variable to a random string');
				process.exit(1);
			}
		}

		let url: URL;
		try {
			url = new URL(process.env.DATABASE_URL!);
			url.searchParams.set('multipleStatements', 'true');
			process.env.DATABASE_URL = url.toString();

			const { db } = await import('@/db');
			const { sql } = await import('kysely');
			
			await sql`select 1`.execute(db);
		} catch (e) {
			console.error('[FATAL] database connection failed! Please check that the DATABASE_URL variable is correct');
			console.error(e);
			process.exit(1);
		}

		if (['true', 'yes', '1'].includes(process.env.AUTOMIGRATE?.toLowerCase()!)) {
			process.env.DATABASE_URL = url.toString();
			// using require here increases build times to like 10 minutes for some reason
			const DBMigrate = await eval('imp' + 'ort("db-migrate")');
			const dbmigrate = DBMigrate.getInstance(true);
			await dbmigrate.up();

			if (process.env.NODE_ENV === 'production')
				delete process.env.DATABASE_URL;
		}

		const { loadConfig } = await import('./config');
		try {
			await loadConfig();
		} catch (e) {
			console.error('[FATAL] failed to load config');
			console.error(e);
			process.exit(1);
		}

		const { createActaeonTeamsFromExistingTeams } = await import('./data/team');
		const { createActaeonFriendsFromExistingFriends } = await import('./data/friend');

		await Promise.all([
			createActaeonTeamsFromExistingTeams().catch(console.error),
			createActaeonFriendsFromExistingFriends().catch(console.error)
		]);
	} else if (process.env.NEXT_RUNTIME === 'edge') {
		(globalThis as any).bcrypt = {};
		(globalThis as any).mysql2 = {};
	}
}
