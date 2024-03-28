import { DB } from '@/types/db';
import { createPool } from 'mysql2';
import { Generated, Kysely, MysqlDialect } from 'kysely';

const createDb = () => {
	if (process.env.NEXT_RUNTIME === 'edge')
		return null;

	if ((globalThis as any).db)
		return (globalThis as any).db as Kysely<GeneratedDB>;

	const dialect = new MysqlDialect({
		pool: createPool(process.env.DATABASE_URL as string)
	});

	if (process.env.NODE_ENV === 'production')
		delete process.env.DATABASE_URL;

	return (globalThis as any).db = new Kysely<GeneratedDB>({ dialect });
}


type IdGenerated<C, T> = C extends 'id' ? Generated<T> : T;

// mark all id fields as generated
export type GeneratedDB = {
	[Table in keyof DB]: {
		[Column in keyof DB[Table]]: IdGenerated<Column, DB[Table][Column]>
	}
};

export const db = createDb()!;
