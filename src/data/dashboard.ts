import { getUser } from '@/actions/auth';
import { db } from '@/db';
import { UserPayload } from '@/types/user';

export const getDashboard = async (user: UserPayload | undefined | null) => {
	if (!user) return null;
	const dashboard = await db.selectFrom('actaeon_user_ext')
		.where('userId', '=', user.id)
		.select('dashboard')
		.executeTakeFirst();
	try {
		if (dashboard?.dashboard)
			return JSON.parse(dashboard.dashboard);
	} catch { }
	return null;
};
