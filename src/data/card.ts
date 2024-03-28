import { db } from '@/db';
import { ActionResult } from '@/types/action-result';

export const addCardToUser = async (user: number, code: string): Promise<ActionResult<{ id: number }>> => {
	if (!/^\d{20}$/.test(code))
		return { error: true, message: 'Invalid access code format' };
	
	const existingUser = await db.selectFrom('aime_card')
		.where('access_code', '=', code)
		.select('access_code')
		.executeTakeFirst();
	
	if (existingUser)
		return { error: true, message: 'That access code is already in use' };

	const insertResult = await db.insertInto('aime_card')
		.values({
			access_code: code,
			user,
			created_date: new Date(),
			is_locked: 0,
			is_banned: 0
		})
		.executeTakeFirst();
	
	return { id: Number(insertResult.insertId) };
};
