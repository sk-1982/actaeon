'use server';

import { requireUser } from '@/actions/auth';
import { db } from '@/db';
import { UserPermissions } from '@/types/permissions';
import { requirePermission } from '@/helpers/permissions';
import { addCardToUser } from '@/data/card';
import { AdminUser, getUsers } from '@/data/user';
import { ActionResult } from '@/types/action-result';
import { revalidatePath } from 'next/cache';

export const getCards = async () => {
	const user = await requireUser();

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
