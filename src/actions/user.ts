'use server';

import { db } from '@/db';
import { requireUser } from '@/actions/auth';
import { USER_PERMISSION_MASK, UserPermissions } from '@/types/permissions';
import { getUsers } from '@/data/user';
import { hasPermission } from '@/helpers/permissions';
import { ActionResult } from '@/types/action-result';

export const createUserWithAccessCode = async (code: string) => {
	await requireUser({ permission: UserPermissions.USERMOD });

	if (!/^\d{20}$/.test(code))
		return { error: true, message: 'Invalid access code format', data: [] };

	const existingUser = await db.selectFrom('aime_card')
		.where('access_code', '=', code)
		.select('access_code')
		.executeTakeFirst();
	
	if (existingUser)
		return { error: true, message: 'That access code is already in use', data: [] };

	await db.transaction().execute(async trx => { 
		const now = new Date();
		const insertResult = await trx.insertInto('aime_user')
			.values({
				created_date: now,
				permissions: 1
			})
			.executeTakeFirstOrThrow();
		
		await trx.insertInto('aime_card')
			.values({
				user: Number(insertResult.insertId),
				access_code: code,
				created_date: now,
				is_banned: 0,
				is_locked: 0
			})
			.executeTakeFirst();
	});

	return { error: false, message: '', data: await getUsers() };
};

export const deleteUser = async (user: number): Promise<ActionResult> => {
	const adminUser = await requireUser({ permission: UserPermissions.USERMOD });

	if (adminUser.id === user)
		return { error: true, message: 'You cannot delete yourself' };

	const permissions = await db.selectFrom('aime_user')
		.where('id', '=', user)
		.select('permissions')
		.executeTakeFirst();
	
	if (!permissions)
		return { error: true, message: 'User not found' };
	
	if (hasPermission(permissions.permissions, UserPermissions.SYSADMIN))
		return { error: true, message: 'You cannot delete that user' };

	await db.deleteFrom('aime_user')
		.where('id', '=', user)
		.executeTakeFirst();
	
	return {};
};

export const setUserPermissions = async (user: number, permissions: number) => { 
	await requireUser({ permission: UserPermissions.OWNER });

	permissions &= USER_PERMISSION_MASK;

	await db.updateTable('aime_user')
		.where('id', '=', user)
		.set(({ eb, parens }) => ({
			permissions: eb(
				parens(eb('permissions', '&', 1 << UserPermissions.OWNER)), // if already owner, keep owner status
				'|',
				permissions)
		}))
		.executeTakeFirst();
};
