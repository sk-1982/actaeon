import { getDashboard } from '@/data/dashboard';
import { Dashboard } from './dashboard';
import { getUser } from '@/actions/auth';
import { getUserData } from '@/actions/chuni/profile';
import { getServerStatus } from '@/data/status';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
	const [user, status] = await Promise.all([
		getUser(),
		getServerStatus().then(d => structuredClone(d))
	]);

	if (!user) return (<Dashboard serverStatus={status} />)

	const [chuniProfile, dashboard] = await Promise.all([
		getUserData(user).then(d => structuredClone(d)),
		getDashboard(user)
	]);

	return (<Dashboard chuniProfile={chuniProfile} serverStatus={status} dashboard={dashboard} />);
}
