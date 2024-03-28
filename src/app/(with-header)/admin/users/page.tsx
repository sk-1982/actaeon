import { requireUser } from '@/actions/auth';
import { UserPermissions } from '@/types/permissions';
import { AdminUserList } from '@/components/admin-user-list';
import { getUsers } from '@/data/user';

export default async function AdminUsersPage() {
	await requireUser({ permission: UserPermissions.USERMOD });
	const users = await getUsers();

	return (<AdminUserList users={users} />);
}
