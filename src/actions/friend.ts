'use server';

import { GeneratedDB, db } from '@/db';
import { getUser, requireUser } from './auth';
import { notFound } from 'next/navigation';
import { Transaction, sql } from 'kysely';
import { syncUserFriends, withChuniRivalCount } from '@/data/friend';
import { revalidatePath } from 'next/cache';

export const getFriendRequests = async () => {
	const user = await getUser();
	if (!user) return [];
	
	return structuredClone(await db.selectFrom('actaeon_friend_requests as req')
		.where('user', '=', user.id)
		.innerJoin('aime_user as u', 'u.id', 'req.friend')
		.innerJoin('actaeon_user_ext as ext', 'ext.userId', 'u.id')
		.select([
			'req.friend', 'req.createdDate', 'req.uuid as reqUuid',
			'u.username',
			'ext.uuid as userUuid'
		])
		.orderBy('req.createdDate desc')
		.execute());
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
	
	revalidatePath('/user/[userId]', 'page');
	revalidatePath('/friends', 'page');
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

	revalidatePath('/user/[userId]', 'page');
	revalidatePath('/friends', 'page');
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
			] as const);
		
		await trx.insertInto('actaeon_user_friends')
			.columns(['user1', 'user2', 'chuniRival'])
			.expression(selectSql)
			.execute();
	
		await trx.deleteFrom('actaeon_friend_requests')
			.where('uuid', '=', id)
			.executeTakeFirst();
		
		await syncUserFriends(user.id, trx);
		await syncUserFriends(request.friend, trx);
	});

	revalidatePath('/user/[userId]', 'page');
	revalidatePath('/friends', 'page');
};

export const rejectFriendRequest = async (id: string) => {
	const user = await requireUser();

	await db.deleteFrom('actaeon_friend_requests')
		.where('user', '=', user.id)
		.where('uuid', '=', id)
		.executeTakeFirst();
};

const setRivalStatus = (user1: number, user2: number, chuniRival: number, trx: Transaction<GeneratedDB>) => {
	return trx.updateTable('actaeon_user_friends')
		.where(({ and, eb, or }) => or([
			and([
				eb('user1', '=', user1),
				eb('user2', '=', user2)
			]),
			and([
				eb('user2', '=', user1),
				eb('user1', '=', user2)
			]),
		]))
		.set({ chuniRival })
		.execute();
}

export const addFriendAsRival = async (friend: number) => {
	const user = await requireUser();

	const rivalCount = await withChuniRivalCount()
		.selectFrom('chuni_rival_count')
		.where(({ or, eb }) => or([
			eb('user', '=', user.id),
			eb('user', '=', friend)
		]))
		.select(['user', 'rivalCount'])
		.execute();

	const userRivalCount = Number(rivalCount.find(r => r.user === user.id)?.rivalCount ?? 0);
	const friendRivalCount = Number(rivalCount.find(r => r.user === friend)?.rivalCount ?? 0);
	
	if (userRivalCount >= 4)
		return { error: true, message: 'You already have 4 rivals. You must remove a rival before adding a new one.' };
	if (friendRivalCount >= 4)
		return { error: true, message: 'This user already has 4 rivals. They must remove a rival before you can add them as a rival.' };

	await db.transaction().execute(async trx => {
		await setRivalStatus(user.id, friend, 1, trx);

		await syncUserFriends(user.id, trx);
		await syncUserFriends(friend, trx);
	});

	revalidatePath('/user/[userId]', 'page');
	revalidatePath('/friends', 'page');
};

export const removeFriendAsRival = async (friend: number) => {
	const user = await requireUser();

	await db.transaction().execute(async trx => {
		await setRivalStatus(user.id, friend, 0, trx);
		
		await syncUserFriends(user.id, trx);
		await syncUserFriends(friend, trx);
	});

	revalidatePath('/user/[userId]', 'page');
	revalidatePath('/friends', 'page');
};
