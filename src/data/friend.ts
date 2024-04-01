import { GeneratedDB, db } from '@/db';
import { Kysely, Transaction } from 'kysely';

export const createActaeonFriendsFromExistingFriends = async () => {
	await db.insertInto('actaeon_user_friends')
		.columns(['user1', 'user2', 'chuniRival'])
		.expression(eb => eb.selectFrom('chuni_item_favorite as fav')
			.where('fav.favKind', '=', 2)
			.innerJoin('aime_user as u1', 'u1.id', 'fav.user')
			.innerJoin('aime_user as u2', 'u2.id', 'fav.favId')
			.where(({ not, exists, selectFrom }) => not(exists(selectFrom('actaeon_user_friends as actaeon_friends')
				.whereRef('actaeon_friends.user1', '=', 'u1.id')
				.whereRef('actaeon_friends.user2', '=', 'u2.id')
				.select(eb => eb.lit(1).as('v'))
			)))
			.select(eb => ['u1.id as user1', 'u2.id as user2', eb.lit(1).as('chuniRival')] as const))
		.execute();
};

export const withChuniRivalCount = (builder: Kysely<GeneratedDB> | Transaction<GeneratedDB> = db) =>
	builder.with('chuni_rival_count', db => db
		.selectFrom('chuni_item_favorite')
		.where(({ eb, lit }) => eb('favKind', '=', lit(2)))
		.groupBy('user')
		.select(eb => [
			'user', eb.fn.count('favId').as('rivalCount')
		] as const))
	.with('chuni_max_rival_count', db => db
		.selectFrom(['chuni_rival_count as r1', 'chuni_rival_count as r2'])
		.groupBy(['r1.user', 'r2.user'])
		.select(({ fn }) => ['r1.user as user1', 'r2.user as user2',
			fn<number>('greatest', ['r1.rivalCount', 'r2.rivalCount']).as('maxRivalCount')
		] as const));

export const syncUserFriends = async (user: number, builder: Kysely<GeneratedDB> | Transaction<GeneratedDB> = db) => {
	await builder.deleteFrom('chuni_item_favorite')
		.where('favKind', '=', 2)
		.where('user', '=', user)
		.where(({ not, exists, selectFrom, and, eb }) => and([
			not(exists(selectFrom('actaeon_user_friends as friends')
			.whereRef('friends.user1', '=', 'user')
			.whereRef('friends.user2', '=', 'favId')
			.where('friends.chuniRival', '=', 1)
				.select('chuniRival'))),
			eb('version', '=', selectFrom('chuni_static_music')
				.select(({ fn }) => fn.max('version').as('latest')))
		]))
		.execute();
	
	await builder.insertInto('chuni_item_favorite')
		.columns(['user', 'favId', 'favKind', 'version'])
		.expression(eb => eb.selectFrom('actaeon_user_friends as friends')
			.where('friends.user1', '=', user)
			.where('friends.chuniRival', '=', 1)
			.where(({ not, exists, selectFrom }) => not(exists(selectFrom('chuni_item_favorite as favorite')
				.whereRef('favorite.user', '=', 'friends.user1')
				.whereRef('favorite.favId', '=', 'friends.user2')
				.where('favorite.favKind', '=', 2)
				.select('favorite.id'))))
			.select(eb => [
				'friends.user1 as user', 'friends.user2 as favId',
				eb.lit(2).as('favKind'),
				eb.selectFrom('chuni_static_music')
					.select(({ fn }) => fn.max('version').as('latest'))
					.as('version')
			] as const))
		.execute();
	
	const rivalCount = await withChuniRivalCount(builder)
		.selectFrom('chuni_rival_count')
		.where('chuni_rival_count.user', '=', user)
		.select('chuni_rival_count.rivalCount')
		.executeTakeFirst();
	
	await db.updateTable('chuni_profile_data')
		.where('user', '=', user)
		.where(({ eb, selectFrom }) => eb('version', '=', selectFrom('chuni_static_music')
			.select(({ fn }) => fn.max('version').as('latest'))))
		.set({
			friendCount: Number(rivalCount?.rivalCount ?? 0)
		})
		.executeTakeFirst();
};

export const getFriends = async (user: number) => {
	return db.selectFrom('actaeon_user_friends as friend')
		.where('friend.user1', '=', user)
		.innerJoin('aime_user as u', 'u.id', 'friend.user2')
		.innerJoin('actaeon_user_ext as ext', 'ext.userId', 'u.id')
		.select(['friend.user2 as id', 'friend.chuniRival', 'u.username', 'ext.uuid'])
		.execute();
};

export type Friend = Awaited<ReturnType<typeof getFriends>>[number];
