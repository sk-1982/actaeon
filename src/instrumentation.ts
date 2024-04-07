export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		console.log(`\x1b[38;2;115;0;172m▄\x1b[38;2;120;0;174m▀\x1b[38;2;125;0;176m█\x1b[38;2;131;0;178m \x1b[38;2;136;0;180m█\x1b[38;2;141;0;182m▀\x1b[38;2;146;0;184m▀\x1b[38;2;151;0;187m \x1b[38;2;156;0;189m▀\x1b[38;2;162;0;191m█\x1b[38;2;167;0;193m▀\x1b[38;2;172;0;195m \x1b[38;2;177;0;197m▄\x1b[38;2;182;0;199m▀\x1b[38;2;188;0;201m█\x1b[38;2;193;0;203m \x1b[38;2;198;0;205m█\x1b[38;2;203;0;207m▀\x1b[38;2;208;0;209m▀\x1b[38;2;214;0;211m \x1b[38;2;219;0;213m█\x1b[38;2;224;0;216m▀\x1b[38;2;229;0;218m█\x1b[38;2;234;0;220m \x1b[38;2;239;0;222m█\x1b[38;2;245;0;224m▄\x1b[38;2;250;0;226m░\x1b[38;2;255;0;228m█\x1b[m`);
		console.log(`\x1b[38;2;115;0;172m█\x1b[38;2;120;0;174m▀\x1b[38;2;125;0;176m█\x1b[38;2;131;0;178m \x1b[38;2;136;0;180m█\x1b[38;2;141;0;182m▄\x1b[38;2;146;0;184m▄\x1b[38;2;151;0;187m \x1b[38;2;156;0;189m░\x1b[38;2;162;0;191m█\x1b[38;2;167;0;193m░\x1b[38;2;172;0;195m \x1b[38;2;177;0;197m█\x1b[38;2;182;0;199m▀\x1b[38;2;188;0;201m█\x1b[38;2;193;0;203m \x1b[38;2;198;0;205m█\x1b[38;2;203;0;207m█\x1b[38;2;208;0;209m▄\x1b[38;2;214;0;211m \x1b[38;2;219;0;213m█\x1b[38;2;224;0;216m▄\x1b[38;2;229;0;218m█\x1b[38;2;234;0;220m \x1b[38;2;239;0;222m█\x1b[38;2;245;0;224m░\x1b[38;2;250;0;226m▀\x1b[38;2;255;0;228m█\x1b[m`);
		console.log('This is free software. \x1B[1mIf you payed for it, you have been scammed.\x1b[m')

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
