'use server';

import { db } from '@/db';
import { getUser, requireUser } from './auth';
import { notFound } from 'next/navigation';
import { CompiledQuery, sql } from 'kysely';
import { syncUserFriends, withChuniRivalCount } from '@/data/friend';
import { SqlBool } from 'kysely';
import { Exact } from 'type-fest';

export const getFriendRequests = async () => {
	const user = await getUser();
	if (!user) return [];
	
	return db.selectFrom('actaeon_friend_requests as req')
		.where('user', '=', user.id)
		.innerJoin('aime_user as u', 'u.id', 'req.friend')
		.innerJoin('actaeon_user_ext as ext', 'ext.userId', 'u.id')
		.select([
			'req.friend', 'req.createdDate', 'req.uuid as reqUuid',
			'u.username',
			'ext.uuid as userUuid'
		])
		.orderBy('req.createdDate desc')
		.execute();
};

export type FriendRequest = Awaited<ReturnType<typeof getFriendRequests>>[number];

export const sendFriendRequest = async (toUser: number) => {
	const requestingUser = await requireUser();

	if (requestingUser.id === toUser) return;

	const existing = await db.selectFrom('actaeon_friend_requests')
		.where('user', '=', toUser)
		.where('friend', '=', requestingUser.id)
		.select('uuid')
		.executeTakeFirst();
	
	if (existing) return;

	await db.insertInto('actaeon_friend_requests')
		.values({
			user: toUser,
			friend: requestingUser.id,
			createdDate: new Date(),
			uuid: sql`uuid_v4()`
		})
		.executeTakeFirst();
}

export const unfriend = async (friend: number) => {
	const user = await requireUser();

	await db.transaction().execute(async trx => {
		await trx.deleteFrom('actaeon_user_friends')
			.where(({ or, eb, and }) => or([
				and([
					eb('user1', '=', friend),
					eb('user2', '=', user.id)
				]),
				and([
					eb('user2', '=', friend),
					eb('user1', '=', user.id)
				])
			]))
			.executeTakeFirst();
		

		await syncUserFriends(user.id, trx);
		await syncUserFriends(friend, trx);
	});
};

export const acceptFriendRequest = async (id: string) => {
	const user = await requireUser();
	const request = await db.selectFrom('actaeon_friend_requests')
		.where('user', '=', user.id)
		.where('uuid', '=', id)
		.select(['friend'])
		.executeTakeFirst();
	
	if (!request) return notFound();

	await db.transaction().execute(async trx => {
		const COLUMNS = ['user1', 'user2', 'chuniRival'] as const;
		const insertSql = trx.insertInto('actaeon_user_friends')
			.columns(COLUMNS).compile();

		const selectSql = withChuniRivalCount(trx)
			.with('insert_users', db => db.selectNoFrom(({ lit }) => [lit(user.id).as('u1'), lit(request.friend).as('u2')])
				.union(db.selectNoFrom(({ lit }) => [lit(request.friend).as('u1'), lit(user.id).as('u2')])))
			.selectFrom('insert_users')
				.select(({ eb, fn, lit, selectFrom }) => [
					'insert_users.u1 as user1', 'insert_users.u2 as user2',
					eb(fn<number>('coalesce', [selectFrom('chuni_max_rival_count')
						.whereRef('chuni_max_rival_count.user1', '=', 'insert_users.u1')
						.whereRef('chuni_max_rival_count.user2', '=', 'insert_users.u2')
						.select('maxRivalCount'), lit(0)
					]), '<', lit(4))
						.as('chuniRival')
				] as const)
			.compile();
		
		// mariadb needs insert into before cte's but kysely puts it after :(
		
		// if any of these have a type error, then the insert and select statements are not compatible
		type SelectVals = (typeof selectSql) extends CompiledQuery<infer R> ? { [K in keyof R]: R[K] extends SqlBool ? number : R[K] } : never;
		// verify same number of selections in select as insert
		const _: Exact<{ [K in (typeof COLUMNS)[number]]: SelectVals[K] }, SelectVals> = {} as SelectVals;
		// verify data types are insertable
		if (false) db.insertInto('actaeon_user_friends').values({} as SelectVals);
		
		await sql.raw(`${insertSql.sql}\n${selectSql.sql}`).execute(trx);

		await trx.deleteFrom('actaeon_friend_requests')
			.where('uuid', '=', id)
			.executeTakeFirst();
		
		await syncUserFriends(user.id, trx);
		await syncUserFriends(request.friend, trx);
	});
};

export const rejectFriendRequest = async (id: string) => {
	const user = await requireUser();

	await db.deleteFrom('actaeon_friend_requests')
		.where('user', '=', user.id)
		.where('uuid', '=', id)
		.executeTakeFirst();
};
