'use server';

import { requireUser } from '@/actions/auth';
import { db } from '@/db';
import { UserPermissions } from '@/types/permissions';
import { requirePermission } from '@/helpers/permissions';

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
};
