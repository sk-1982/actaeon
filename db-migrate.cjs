const DBMigrate = require('db-migrate');

const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('multipleStatements', 'true');
process.env.DATABASE_URL = url;

const dbmigrate = DBMigrate.getInstance(true);

if (process.argv[2] === 'up')
	dbmigrate.up();
else if (process.argv[2] === 'down')
	dbmigrate.down();
else if (process.argv[2] === 'reset')
	dbmigrate.reset();
else
	console.error('Unknown action', argv[2]);
