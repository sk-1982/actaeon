import { db } from '@/db';
import { ExpressionBuilder } from 'kysely';
import { IsEqual } from 'type-fest';

type TablesWithVersion<DB> = {
	[K in keyof DB]: DB[K] extends ({ version: number }) ? IsEqual<DB[K]['version'], number> extends true ? K : never : never
}[keyof DB];

const selectLatestVersion = <DB, TB extends (keyof DB) & string & TablesWithVersion<DB>, A extends string>(eb: ExpressionBuilder<DB, never>, tb: TB, as: A) => { 
	return eb.selectFrom(tb)
		.select(({ fn }) => fn.max<number>('version' as any).as('v'))
		.as(as);
};
const selectCount = <DB, TB extends (keyof DB) & string, A extends string>(eb: ExpressionBuilder<DB, never>, tb: TB, as: A) => {
	return eb.selectFrom(tb)
		.select(({ fn }: ExpressionBuilder<any, any>) => fn.countAll<number>().as('c'))
		.as(as);
}

export const getServerStatus = async () => { 
	return db.selectNoFrom(eb => [
		selectCount(eb, 'aime_user', 'userCount'),
		selectCount(eb, 'actaeon_teams', 'teamCount'),
		selectCount(eb, 'arcade', 'arcadeCount'),
		selectLatestVersion(eb, 'chuni_static_music', 'chuniVersion')
	])
		.executeTakeFirstOrThrow();
};

export type ServerStatus = Awaited<ReturnType<typeof getServerStatus>>;
