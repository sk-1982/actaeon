import { requireUser } from '@/actions/auth';
import { UserPermissions } from '@/types/permissions';
import { AdminUserList } from './admin-user-list';
import { getUsers } from '@/data/user';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
	await requireUser({ permission: UserPermissions.USERMOD });
	const users = await getUsers();

	return (<AdminUserList users={users} />);
}
