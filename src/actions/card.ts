'use server';

import { requireUser } from '@/actions/auth';
import { db } from '@/db';
import { UserPermissions } from '@/types/permissions';
import { hasPermission, requirePermission } from '@/helpers/permissions';
import { addCardToUser } from '@/data/card';
import { AdminUser, getUsers } from '@/data/user';
import { ActionResult } from '@/types/action-result';
import { revalidatePath } from 'next/cache';
import { getGlobalConfig } from '@/config';
import { UserPayload } from '@/types/user';
import { DB } from '@/types/db';

export const getCards = async (user: UserPayload) => {
	return db.selectFrom('aime_card')
		.where('user', '=', user.id)
		.selectAll()
		.execute();
};

export const banUnbanCard = async (opts: { cardId: number, userId: number, isBan: boolean }) => {
	await requireUser({ permission: UserPermissions.USERMOD });

	await db.updateTable('aime_card')
		.set({ is_banned: +opts.isBan })
		.where(({ and, eb }) => and([
			eb('id', '=', opts.cardId),
			eb('user', '=', opts.userId)
		]))
		.executeTakeFirst();
	
	revalidatePath('/settings', 'page');
	revalidatePath('/admin/users', 'page');
};

export const lockUnlockCard = async (opts: { cardId: number, userId: number, isLock: boolean }) => {
	const user = await requireUser();
	if (opts.userId !== user.id)
		requirePermission(user.permissions, UserPermissions.USERMOD);

	await db.updateTable('aime_card')
		.set({ is_locked: +opts.isLock })
		.where(({ and, eb }) => and([
			eb('id', '=', opts.cardId),
			eb('user', '=', opts.userId)
		]))
		.executeTakeFirst();
	
	revalidatePath('/settings', 'page');
	revalidatePath('/admin/users', 'page');
};

export const adminAddCardToUser = async (user: number, code: string): Promise<ActionResult<{ data: AdminUser[] }>> => {
	await requireUser({ permission: UserPermissions.USERMOD });

	const res = await addCardToUser(user, code);

	if (res.error)
		return res;

	revalidatePath('/settings', 'page');
	revalidatePath('/admin/users', 'page');

	return { data: await getUsers() };
};

export const userAddCard = async (code: string): Promise<ActionResult<{ card: DB['aime_card'] }>> => {
	const user = await requireUser();

	if (!hasPermission(user.permissions, UserPermissions.USERMOD)) {
		const cards = await getCards(user);

		if (!getGlobalConfig('allow_user_add_card'))
			return { error: true, message: 'You do not have permissions to add a card' };

		if (cards.length >= (getGlobalConfig('user_max_card') ?? Infinity))
			return { error: true, message: 'You cannot add a card because you have reached your max card count' };
	}

	const res = await addCardToUser(user.id, code);

	if (res.error)
		return res;

	revalidatePath('/settings', 'page');
	revalidatePath('/admin/users', 'page');
	
	return {
		card: {
		id: res.id,
		access_code: code,
		user: user.id,
		created_date: new Date(),
		is_locked: 0,
		is_banned: 0,
		last_login_date: null
	}};
};
